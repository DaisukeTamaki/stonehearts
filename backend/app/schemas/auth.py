from pydantic import BaseModel

__all__ = [
    "TokenPayload",
    "AccessTokenResponse",
    "DecodedTokenPayload",
]


class TokenPayload(BaseModel):
    token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DecodedTokenPayload(BaseModel):
    sub: str
