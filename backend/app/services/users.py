from typing import List, Optional
from bson import ObjectId
from app.core.security import get_password_hash
from app.models.user import UserCreate, UserInDB, UserUpdate
from datetime import datetime

class UserService:
    @staticmethod
    async def get_by_email(db, email: str) -> Optional[UserInDB]:
        user_dict = await db.users.find_one({"email": email})
        if user_dict:
            return UserInDB(**user_dict)
        return None

    @staticmethod
    async def get_by_id(db, user_id: str) -> Optional[UserInDB]:
        if not ObjectId.is_valid(user_id):
            return None
        user_dict = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_dict:
            return UserInDB(**user_dict)
        return None

    @staticmethod
    async def create(db, user_create: UserCreate) -> UserInDB:
        hashed_password = get_password_hash(user_create.password)
        user_dict = user_create.model_dump(exclude={"password"})
        user_dict["hashed_password"] = hashed_password
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        result = await db.users.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return UserInDB(**user_dict)

    @staticmethod
    async def update(db, user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        if not ObjectId.is_valid(user_id):
            return None
        
        update_data = user_update.model_dump(exclude_unset=True)
        if not update_data:
            return await UserService.get_by_id(db, user_id)
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.users.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            return UserInDB(**result)
        return None

    @staticmethod
    async def list_users(db, skip: int = 0, limit: int = 20) -> List[UserInDB]:
        cursor = db.users.find().skip(skip).limit(limit)
        users = []
        async for user_dict in cursor:
            users.append(UserInDB(**user_dict))
        return users
