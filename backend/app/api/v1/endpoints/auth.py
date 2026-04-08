from datetime import datetime, timezone
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, verify_google_token
from app.crud.user import create_user, get_user_by_email
from app.db import get_db
from app.schemas.auth import AccessTokenResponse, TokenPayload

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/google-login", response_model=AccessTokenResponse)
async def google_login(
    payload: TokenPayload,
    db: AsyncSession = Depends(get_db),
) -> AccessTokenResponse:
    user_info = await verify_google_token(payload.token)

    user = await get_user_by_email(db, user_info["email"])
    if not user:
        user = await create_user(
            db,
            email=user_info["email"],
            name=user_info.get("name"),
            oauth_provider="google",
            oauth_provider_id=user_info["oauth_provider_id"],
        )
    else:
        user.last_login_at = datetime.now(timezone.utc)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return AccessTokenResponse(access_token=token)
