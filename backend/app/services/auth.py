from typing import Optional
from app.core.security import verify_password
from app.models.user import UserInDB
from app.services.users import UserService

class AuthService:
    @staticmethod
    async def authenticate_user(db, email: str, password: str) -> Optional[UserInDB]:
        user = await UserService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
