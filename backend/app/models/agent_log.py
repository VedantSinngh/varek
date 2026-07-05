from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.models.common import PyObjectId

class LogStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING_APPROVAL = "pending_approval"

class AgentLogCreate(BaseModel):
    agent_name: str
    action: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    status: LogStatus
    cost: Optional[float] = None
    related_task_id: Optional[str] = None

class AgentLogInDB(AgentLogCreate):
    id: PyObjectId = Field(default=None, alias="_id")
    log_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class AgentLogResponse(AgentLogInDB):
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
