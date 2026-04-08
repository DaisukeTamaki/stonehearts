from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

__all__ = [
    "UserResponse",
    "UserInDB",
]


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str | None = None
    created_at: datetime
    last_login_at: datetime


class UserInDB(UserResponse):
    oauth_provider: str
    oauth_provider_id: str
    is_active: bool
    is_superuser: bool

    model_config = ConfigDict(from_attributes=True)
