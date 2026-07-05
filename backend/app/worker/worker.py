import asyncio
import logging
import os
import sys
from datetime import datetime
from bson import ObjectId

# Ensure we can import app package correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.db.database import connect_to_databases, close_database_connections, get_mongodb
from app.utils.queue import RedisQueue
from app.agents.dummy_agent import DummyAgent
from app.agents.inventory_agent import InventoryAgent
from app.agents.support_agent import SupportAgent
from app.models.task import TaskStatus, TaskInDB, StatusHistoryItem
from app.models.agent_log import AgentLogCreate, LogStatus
from app.services.agent_logs import AgentLogService

# Configure worker logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("worker")

async def process_task(task_payload: dict, db):
    task_id = task_payload.get("task_id")
    if not task_id:
        logger.error("Worker: Received task payload without a task_id")
        return
        
    logger.info(f"Worker: Starting processing for task {task_id}")
    
    # 1. Fetch Task from Mongo
    query = {"_id": ObjectId(task_id)} if ObjectId.is_valid(task_id) else {"task_id": task_id}
    task_dict = await db.tasks.find_one(query)
    if not task_dict:
        logger.error(f"Worker: Task {task_id} not found in database. Skipping.")
        return
        
    task = TaskInDB(**task_dict)
    
    # Check if task is already completed/failed
    # (Notice: we allow task processing if it is in awaiting_approval and we are resuming it, 
    # but otherwise skip it if it is already completed/failed)
    if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED):
        logger.warning(f"Worker: Task {task_id} is in status '{task.status}'. Skipping processing.")
        return
        
    target = task.target_agent or "dummy_agent"

    # 2. Update status to IN_PROGRESS in MongoDB
    history_item = StatusHistoryItem(
        status=TaskStatus.IN_PROGRESS,
        details=f"Worker picked up task. Routing to agent '{target}'."
    )
    await db.tasks.update_one(
        {"_id": task_dict["_id"]},
        {
            "$set": {
                "status": TaskStatus.IN_PROGRESS,
                "assigned_agent": target,
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "status_history": history_item.model_dump()
            }
        }
    )
    
    # Log starting execution
    await AgentLogService.create(db, AgentLogCreate(
        agent_name=target,
        action="task_execution_started",
        input={"task_id": task.task_id},
        output={"status": "processing"},
        status=LogStatus.SUCCESS,
        related_task_id=task.task_id
    ))
    
    # 3. Call Agent Engine
    try:
        tool_result = None
        
        # If task has a pending tool call, we execute the tool directly first (Resumption flow)
        if task.pending_tool_call:
            pending = task.pending_tool_call
            tool_name = pending["tool_name"]
            tool_args = pending["arguments"]
            
            logger.info(f"Worker: Resuming approved task {task.task_id}. Executing tool '{tool_name}'...")
            
            if target == "inventory":
                agent = InventoryAgent(db)
            elif target == "support":
                agent = SupportAgent(db)
            else:
                raise Exception(f"Resumption not supported on dummy_agent/unknown agent '{target}'")
                
            # Execute tool directly
            tool_result = await agent.execute_tool(task.task_id, tool_name, tool_args)
            
            # Clear pending tool call from database
            await db.tasks.update_one(
                {"_id": task_dict["_id"]},
                {"$set": {"pending_tool_call": None}}
            )
            
            # Let the agent continue thinking with the tool execution result
            think_outcome = await agent.think(task, tool_override_result=tool_result)
        else:
            # Standard task flow
            if target == "inventory":
                agent = InventoryAgent(db)
                think_outcome = await agent.think(task)
            elif target == "support":
                agent = SupportAgent(db)
                think_outcome = await agent.think(task)
            else:
                dummy_res = await DummyAgent.process(task_dict)
                think_outcome = {"action": "complete", "result": dummy_res}
                
        # 4. Handle Agent Thinking Outcomes (pause_for_approval vs complete)
        action = think_outcome.get("action")
        if action == "pause_for_approval":
            pending = think_outcome["pending_tool_call"]
            
            # Update status to AWAITING_APPROVAL in MongoDB
            pause_history = StatusHistoryItem(
                status=TaskStatus.AWAITING_APPROVAL,
                details=f"Task paused: proposed tool call '{pending['tool_name']}' requires manual approval"
            )
            await db.tasks.update_one(
                {"_id": task_dict["_id"]},
                {
                    "$set": {
                        "status": TaskStatus.AWAITING_APPROVAL,
                        "pending_tool_call": pending,
                        "updated_at": datetime.utcnow()
                    },
                    "$push": {
                        "status_history": pause_history.model_dump()
                    }
                }
            )
            
            # Log pause
            await AgentLogService.create(db, AgentLogCreate(
                agent_name=target,
                action="task_paused_for_tool_approval",
                input={"task_id": task.task_id, "tool_name": pending["tool_name"]},
                output={"status": "awaiting_approval"},
                status=LogStatus.PENDING_APPROVAL,
                related_task_id=task.task_id
            ))
            logger.info(f"Worker: Task {task_id} PAUSED for tool approval.")
            
        else:
            # Task completion
            result_data = think_outcome.get("result", {})
            success_history = StatusHistoryItem(
                status=TaskStatus.COMPLETED,
                details=f"Agent '{target}' completed task successfully"
            )
            await db.tasks.update_one(
                {"_id": task_dict["_id"]},
                {
                    "$set": {
                        "status": TaskStatus.COMPLETED,
                        "result": result_data,
                        "updated_at": datetime.utcnow()
                    },
                    "$push": {
                        "status_history": success_history.model_dump()
                    }
                }
            )
            
            # Audit log success
            await AgentLogService.create(db, AgentLogCreate(
                agent_name=target,
                action="task_processed",
                input={"task_id": task.task_id},
                output=result_data,
                status=LogStatus.SUCCESS,
                related_task_id=task.task_id
            ))
            
            # Write final text reply to agent memory
            final_output = result_data.get("output", "")
            if final_output:
                if target == "inventory":
                    await agent.remember(task.task_id, "restock_action", {"sku": task.payload.get("sku"), "output": final_output})
                elif target == "support":
                    await agent.remember(task.task_id, "response_action", {"order_id": task.payload.get("order_id"), "output": final_output})
            
            logger.info(f"Worker: Task {task_id} marked as COMPLETED")
            
    except Exception as e:
        # 5. Fail: update task status
        error_msg = str(e)
        logger.error(f"Worker: Failed to process task {task_id}: {error_msg}")
        
        failed_history = StatusHistoryItem(
            status=TaskStatus.FAILED,
            details=f"Task execution failed: {error_msg}"
        )
        await db.tasks.update_one(
            {"_id": task_dict["_id"]},
            {
                "$set": {
                    "status": TaskStatus.FAILED,
                    "result": {"error": error_msg},
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "status_history": failed_history.model_dump()
                }
            }
        )
        
        # Audit log failure
        await AgentLogService.create(db, AgentLogCreate(
            agent_name=target,
            action="task_processed",
            input={"task_id": task.task_id},
            output={"error": error_msg},
            status=LogStatus.FAILED,
            related_task_id=task.task_id
        ))

async def main():
    logger.info("Worker: Starting worker process...")
    await connect_to_databases()
    
    db = get_mongodb()
    queue = RedisQueue()
    
    logger.info("Worker: Blocking and waiting for tasks from queue...")
    
    try:
        while True:
            # Poll Redis task list (blocks up to 5 seconds if empty)
            task_payload = await queue.pop(timeout=5)
            if task_payload:
                try:
                    await process_task(task_payload, db)
                except Exception as ex:
                    logger.exception(f"Worker: Unhandled exception during task processing: {ex}")
            else:
                # brief pause to yield loop execution if not blocked
                await asyncio.sleep(0.1)
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Worker: Shutdown requested.")
    finally:
        await close_database_connections()
        logger.info("Worker: Shutdown complete.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker process exited.")
