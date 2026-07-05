from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.core.dependencies import get_current_active_user, get_admin_user
from app.db.database import get_mongodb
from app.models.user import UserInDB
from app.models.task import TaskCreate, TaskResponse, TaskStatus, TaskPriority, TaskUpdate, StatusHistoryItem, TaskInDB

from app.models.agent_log import AgentLogCreate, LogStatus
from app.services.agent_logs import AgentLogService
from app.services.tasks import TaskService
from app.utils.queue import RedisQueue
from datetime import datetime
from bson import ObjectId


router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_create: TaskCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    return await TaskService.create(db, task_create, created_by=str(current_user.id))

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[TaskStatus] = Query(None),
    agent: Optional[str] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    target_agent: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    return await TaskService.list_tasks(
        db,
        skip=skip,
        limit=limit,
        status=status,
        agent=agent,
        priority=priority,
        target_agent=target_agent
    )


@router.get("/detailed-approvals")
async def list_detailed_approvals(
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    tasks_cursor = db.tasks.find({"status": TaskStatus.AWAITING_APPROVAL})
    enriched_list = []
    async for task_dict in tasks_cursor:
        task = TaskInDB(**task_dict)
        log_dict = await db.agent_logs.find_one(
            {"related_task_id": task.task_id},
            sort=[("timestamp", -1)]
        )
        if log_dict:
            log_dict["_id"] = str(log_dict["_id"])
            log_dict["id"] = log_dict["_id"]
            
        task_res = task.model_dump(by_alias=True)
        task_res["id"] = str(task_res["id"]) if task_res.get("id") else None
        
        enriched_list.append({
            **task_res,
            "proposed_action_log": log_dict
        })
    return enriched_list

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    task = await TaskService.get_by_id(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    task = await TaskService.update(db, task_id, task_update)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

@router.post("/{task_id}/approve", response_model=TaskResponse)
async def approve_task(
    task_id: str,
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    query = {"_id": ObjectId(task_id)} if ObjectId.is_valid(task_id) else {"task_id": task_id}
    task_dict = await db.tasks.find_one(query)
    if not task_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task_dict["status"] != TaskStatus.AWAITING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is in status '{task_dict['status']}' and cannot be approved"
        )
        
    # Transition task to queued status
    history_item = StatusHistoryItem(
        status=TaskStatus.QUEUED,
        details=f"Task approved manually by admin ({current_admin.email})"
    )
    
    await db.tasks.update_one(
        {"_id": task_dict["_id"]},
        {
            "$set": {
                "status": TaskStatus.QUEUED,
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "status_history": history_item.model_dump()
            }
        }
    )
    
    # Audit log the approval
    await AgentLogService.create(db, AgentLogCreate(
        agent_name="executive",
        action="task_approved",
        input={"task_id": task_dict["task_id"], "approved_by": current_admin.email},
        output={"status": "approved"},
        status=LogStatus.SUCCESS,
        related_task_id=task_dict["task_id"]
    ))
    
    # Queue task back to Redis
    queue = RedisQueue()
    await queue.push({"task_id": task_dict["task_id"]})
    
    # Fetch and return updated task
    updated = await TaskService.get_by_id(db, task_id)
    return updated

@router.post("/{task_id}/reject", response_model=TaskResponse)
async def reject_task(
    task_id: str,
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    query = {"_id": ObjectId(task_id)} if ObjectId.is_valid(task_id) else {"task_id": task_id}
    task_dict = await db.tasks.find_one(query)
    if not task_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task_dict["status"] != TaskStatus.AWAITING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is in status '{task_dict['status']}' and cannot be rejected"
        )
        
    # Transition task to rejected status
    history_item = StatusHistoryItem(
        status=TaskStatus.REJECTED,
        details=f"Task rejected manually by admin ({current_admin.email})"
    )
    
    await db.tasks.update_one(
        {"_id": task_dict["_id"]},
        {
            "$set": {
                "status": TaskStatus.REJECTED,
                "pending_tool_call": None,
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "status_history": history_item.model_dump()
            }
        }
    )
    
    # Audit log the rejection
    await AgentLogService.create(db, AgentLogCreate(
        agent_name="executive",
        action="task_rejected",
        input={"task_id": task_dict["task_id"], "rejected_by": current_admin.email},
        output={"status": "rejected"},
        status=LogStatus.SUCCESS,
        related_task_id=task_dict["task_id"]
    ))
    
    # Fetch and return updated task
    updated = await TaskService.get_by_id(db, task_id)
    return updated


