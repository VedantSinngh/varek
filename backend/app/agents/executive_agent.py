import logging
from datetime import datetime
from bson import ObjectId
from app.db.database import get_mongodb
from app.models.task import TaskStatus, TaskInDB, StatusHistoryItem
from app.models.agent_log import LogStatus
from app.services.agent_logs import AgentLogService
from app.models.agent_log import AgentLogCreate
from app.utils.queue import RedisQueue

logger = logging.getLogger(__name__)

class ExecutiveAgent:
    @staticmethod
    async def receive_task(task_id: str, db) -> bool:
        """
        Intake task, evaluate if approval is required, log operations,
        and optionally push to the Redis queue.
        """
        logger.info(f"ExecutiveAgent: Receiving task with ID: {task_id}")
        
        # 1. Fetch Task
        query = {"_id": ObjectId(task_id)} if ObjectId.is_valid(task_id) else {"task_id": task_id}
        task_dict = await db.tasks.find_one(query)
        if not task_dict:
            logger.error(f"ExecutiveAgent: Task with ID {task_id} not found in MongoDB")
            return False
            
        task = TaskInDB(**task_dict)
        
        # 2. Log receipt
        await AgentLogService.create(db, AgentLogCreate(
            agent_name="executive",
            action="task_received",
            input={"task_id": task.task_id, "requires_approval": task.requires_approval},
            output={"status": "received"},
            status=LogStatus.SUCCESS,
            related_task_id=task.task_id
        ))

        # 3. Check Approval Block
        if task.requires_approval and task.status != TaskStatus.QUEUED:
            # Task requires approval and hasn't been approved yet
            logger.info(f"ExecutiveAgent: Task {task.task_id} requires manual approval. Pausing.")
            
            history_item = StatusHistoryItem(
                status=TaskStatus.AWAITING_APPROVAL,
                details="Paused by ExecutiveAgent for human-in-the-loop approval"
            )
            
            await db.tasks.update_one(
                {"_id": task_dict["_id"]},
                {
                    "$set": {
                        "status": TaskStatus.AWAITING_APPROVAL,
                        "updated_at": datetime.utcnow()
                    },
                    "$push": {
                        "status_history": history_item.model_dump()
                    }
                }
            )
            
            await AgentLogService.create(db, AgentLogCreate(
                agent_name="executive",
                action="task_paused_for_approval",
                input={"task_id": task.task_id},
                output={"status": "awaiting_approval"},
                status=LogStatus.PENDING_APPROVAL,
                related_task_id=task.task_id
            ))
            return True
            
        # 4. Enqueue task ID
        logger.info(f"ExecutiveAgent: Queueing task {task.task_id} into Redis...")
        queue = RedisQueue()
        pushed = await queue.push({"task_id": task.task_id})
        
        if pushed:
            history_item = StatusHistoryItem(
                status=TaskStatus.QUEUED,
                details="Enqueued into Redis by ExecutiveAgent"
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
            
            await AgentLogService.create(db, AgentLogCreate(
                agent_name="executive",
                action="task_enqueued",
                input={"task_id": task.task_id},
                output={"status": "queued"},
                status=LogStatus.SUCCESS,
                related_task_id=task.task_id
            ))
            return True
        else:
            # Log queue failure
            logger.error(f"ExecutiveAgent: Failed to enqueue task {task.task_id} into Redis")
            await AgentLogService.create(db, AgentLogCreate(
                agent_name="executive",
                action="task_enqueue_failed",
                input={"task_id": task.task_id},
                output={"error": "Redis queue write failed"},
                status=LogStatus.FAILED,
                related_task_id=task.task_id
            ))
            return False
