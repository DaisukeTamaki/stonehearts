from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models.user import User

_security = HTTPBearer()
_security_optional = HTTPBearer(auto_error=False)


async def _resolve_token(token: str, db: AsyncSession) -> User:
    """Decode a JWT and return the corresponding active user, or raise."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Inactive user")
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await _resolve_token(credentials.credentials, db)


async def get_optional_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(_security_optional),
) -> User | None:
    """Return the authenticated user if a valid token is provided, else None."""
    if credentials is None:
        return None
    try:
        return await _resolve_token(credentials.credentials, db)
    except HTTPException:
        return None


async def get_ws_token(token: str | None = Query(None)) -> str | None:
    """Extract an optional bearer token from WebSocket query params."""
    return token


async def get_optional_user_ws(
    db: AsyncSession = Depends(get_db),
    token: str | None = Depends(get_ws_token),
) -> User | None:
    """Resolve user from a WebSocket query-param token."""
    if not token:
        return None
    try:
        return await _resolve_token(token, db)
    except HTTPException:
        return None
