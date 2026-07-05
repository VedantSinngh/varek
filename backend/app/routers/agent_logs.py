from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.core.dependencies import get_current_active_user
from app.db.database import get_mongodb
from app.models.agent_log import AgentLogResponse, LogStatus
from app.models.user import UserInDB
from app.services.agent_logs import AgentLogService

router = APIRouter(prefix="/agent-logs", tags=["agent-logs"])

@router.get("", response_model=List[AgentLogResponse])
async def list_agent_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    agent_name: Optional[str] = Query(None),
    status: Optional[LogStatus] = Query(None),
    task_id: Optional[str] = Query(None, alias="task_id"),
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    return await AgentLogService.list_logs(
        db,
        skip=skip,
        limit=limit,
        agent_name=agent_name,
        status=status,
        related_task_id=task_id
    )


@router.get("/{log_id}", response_model=AgentLogResponse)
async def get_agent_log(
    log_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    log = await AgentLogService.get_by_id(db, log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent log not found"
        )
    return log
