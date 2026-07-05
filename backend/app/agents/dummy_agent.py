import asyncio
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class DummyAgent:
    @staticmethod
    async def process(task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate working on a task.
        In Phase 3, this will be replaced with real LLM reasoning.
        """
        task_id = task.get("task_id", "unknown")
        title = task.get("title", "Untitled")
        logger.info(f"DummyAgent: Starting processing for task '{title}' (ID: {task_id})")
        
        # Simulate LLM reasoning/execution latency
        await asyncio.sleep(2.0)
        
        # Simulate a random failure for a specific payload for testing error handlers
        payload = task.get("payload", {})
        if payload.get("simulate_error") is True:
            logger.error(f"DummyAgent: Simulating error for task {task_id}")
            raise Exception("Simulated execution failure in DummyAgent processing pipeline")
            
        logger.info(f"DummyAgent: Completed processing for task '{title}' (ID: {task_id})")
        return {
            "status": "completed",
            "output": f"Successfully executed task '{title}'. Payload processed: {payload}",
            "processed_at": asyncio.get_event_loop().time()
        }
