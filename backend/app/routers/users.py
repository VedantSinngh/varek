from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from app.core.dependencies import get_current_active_user, get_admin_user
from app.db.database import get_mongodb
from app.models.user import UserResponse, UserUpdate, UserInDB, UserRole
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    users = await UserService.list_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    # Customers can only view themselves; admins can view anyone
    if current_user.role == UserRole.CUSTOMER and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view other users"
        )
        
    user = await UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    # Customer can only edit themselves, and CANNOT change their own role
    if current_user.role == UserRole.CUSTOMER:
        if str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify other users"
            )
        if user_update.role is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers cannot modify their user role"
            )
            
    user = await UserService.update(db, user_id, user_update)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
