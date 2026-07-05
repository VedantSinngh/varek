from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.core.security import verify_token
from app.db.database import get_mongodb
from app.models.user import UserInDB, UserRole

# OAuth2 scheme point to registration/login token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    user_id = verify_token(token, expected_type="access")
    if user_id is None:
        raise credentials_exception
    
    db = get_mongodb()
    try:
        user_dict = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception
        
    if user_dict is None:
        raise credentials_exception
    return UserInDB(**user_dict)

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: UserInDB = Depends(get_current_active_user)) -> UserInDB:
    if current_user.role not in (UserRole.ADMIN, UserRole.FOUNDER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_founder_user(current_user: UserInDB = Depends(get_current_active_user)) -> UserInDB:
    if current_user.role != UserRole.FOUNDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have founder privileges"
        )
    return current_user
