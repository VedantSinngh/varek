from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid
from app.models.common import PyObjectId

class TaskStatus(str, Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    AWAITING_APPROVAL = "awaiting_approval"
    REJECTED = "rejected"


class TaskPriority(int, Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class StatusHistoryItem(BaseModel):
    status: TaskStatus
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[str] = None

class TaskBase(BaseModel):
    title: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    payload: Dict[str, Any] = {}
    requires_approval: bool = False
    target_agent: Optional[str] = None  # Route to: "inventory", "support", "dummy_agent", etc.

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_agent: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    payload: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    status_history: Optional[List[StatusHistoryItem]] = None
    pending_tool_call: Optional[Dict[str, Any]] = None

class TaskInDB(TaskBase):
    id: PyObjectId = Field(default=None, alias="_id")
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assigned_agent: Optional[str] = None
    status: TaskStatus = TaskStatus.QUEUED
    result: Optional[Dict[str, Any]] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status_history: List[StatusHistoryItem] = []
    pending_tool_call: Optional[Dict[str, Any]] = None  # Saves paused action details


    class Config:
        populate_by_name = True

class TaskResponse(TaskInDB):
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
