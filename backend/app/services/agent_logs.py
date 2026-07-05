import uuid
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from app.models.agent_log import AgentLogCreate, AgentLogInDB, LogStatus

class AgentLogService:
    @staticmethod
    async def get_by_id(db, log_id: str) -> Optional[AgentLogInDB]:
        query = {}
        if ObjectId.is_valid(log_id):
            query["_id"] = ObjectId(log_id)
        else:
            query["log_id"] = log_id
            
        log_dict = await db.agent_logs.find_one(query)
        if log_dict:
            return AgentLogInDB(**log_dict)
        return None

    @staticmethod
    async def create(db, log_create: AgentLogCreate) -> AgentLogInDB:
        log_dict = log_create.model_dump()
        log_dict["log_id"] = str(uuid.uuid4())
        log_dict["timestamp"] = datetime.utcnow()
        
        result = await db.agent_logs.insert_one(log_dict)
        log_dict["_id"] = result.inserted_id
        return AgentLogInDB(**log_dict)

    @staticmethod
    async def list_logs(
        db,
        skip: int = 0,
        limit: int = 20,
        agent_name: Optional[str] = None,
        status: Optional[LogStatus] = None,
        related_task_id: Optional[str] = None
    ) -> List[AgentLogInDB]:
        query = {}
        if agent_name:
            query["agent_name"] = agent_name
        if status:
            query["status"] = status
        if related_task_id:
            query["related_task_id"] = related_task_id
            
        cursor = db.agent_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        logs = []
        async for log_dict in cursor:
            logs.append(AgentLogInDB(**log_dict))
        return logs

