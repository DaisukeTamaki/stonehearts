import logging

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings

logger = logging.getLogger(__name__)


async def verify_google_token(token: str) -> dict[str, str]:
    """Verify a Google OAuth2 ID token and return user info.

    Returns dict with keys: email, name, oauth_provider_id.
    Raises HTTPException(400) if the token is invalid or Google OAuth is not configured.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google OAuth is not configured",
        )
    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        return {
            "email": idinfo["email"],
            "name": idinfo.get("name"),
            "oauth_provider_id": idinfo["sub"],
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google token",
        )
