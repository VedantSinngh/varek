import uuid
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from app.models.task import TaskCreate, TaskInDB, TaskStatus, TaskPriority, TaskUpdate, StatusHistoryItem
from app.agents.executive_agent import ExecutiveAgent

class TaskService:
    @staticmethod
    async def get_by_id(db, task_id: str) -> Optional[TaskInDB]:
        # Support search by MongoDB _id or custom uuid `task_id`
        query = {}
        if ObjectId.is_valid(task_id):
            query["_id"] = ObjectId(task_id)
        else:
            query["task_id"] = task_id
            
        task_dict = await db.tasks.find_one(query)
        if task_dict:
            return TaskInDB(**task_dict)
        return None

    @staticmethod
    async def create(db, task_create: TaskCreate, created_by: str) -> TaskInDB:
        task_id_str = str(uuid.uuid4())
        task_dict = task_create.model_dump()
        task_dict["task_id"] = task_id_str
        task_dict["status"] = TaskStatus.QUEUED
        task_dict["created_by"] = created_by
        task_dict["created_at"] = datetime.utcnow()
        task_dict["updated_at"] = datetime.utcnow()
        task_dict["assigned_agent"] = None
        task_dict["result"] = None
        
        # Initialize status history
        initial_history = StatusHistoryItem(
            status=TaskStatus.QUEUED,
            details="Task created in DB"
        )
        task_dict["status_history"] = [initial_history.model_dump()]
        
        result = await db.tasks.insert_one(task_dict)
        task_dict["_id"] = result.inserted_id
        
        # Process through ExecutiveAgent intake
        await ExecutiveAgent.receive_task(task_id_str, db)
        
        # Fetch updated task state
        updated_task = await TaskService.get_by_id(db, task_id_str)
        return updated_task


    @staticmethod
    async def update(db, task_id: str, task_update: TaskUpdate) -> Optional[TaskInDB]:
        query = {}
        if ObjectId.is_valid(task_id):
            query["_id"] = ObjectId(task_id)
        else:
            query["task_id"] = task_id
            
        update_data = task_update.model_dump(exclude_unset=True)
        if not update_data:
            return await TaskService.get_by_id(db, task_id)
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.tasks.find_one_and_update(
            query,
            {"$set": update_data},
            return_document=True
        )
        if result:
            return TaskInDB(**result)
        return None

    @staticmethod
    async def list_tasks(
        db,
        skip: int = 0,
        limit: int = 20,
        status: Optional[TaskStatus] = None,
        agent: Optional[str] = None,
        priority: Optional[TaskPriority] = None,
        target_agent: Optional[str] = None
    ) -> List[TaskInDB]:
        query = {}
        if status:
            query["status"] = status
        if agent:
            query["assigned_agent"] = agent
        if priority:
            query["priority"] = priority
        if target_agent:
            query["target_agent"] = target_agent
            
        cursor = db.tasks.find(query).sort("created_at", -1).skip(skip).limit(limit)
        tasks = []
        async for task_dict in cursor:
            tasks.append(TaskInDB(**task_dict))
        return tasks


