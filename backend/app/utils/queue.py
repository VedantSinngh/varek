import json
import logging
from typing import Any, Dict, Optional
from app.db.database import get_redis

logger = logging.getLogger(__name__)

class RedisQueue:
    def __init__(self, queue_name: str = "varek_tasks"):
        self.queue_name = queue_name

    async def push(self, payload: Dict[str, Any]) -> bool:
        """
        Push a task payload to the right side of the list.
        """
        redis_client = get_redis()
        if not redis_client:
            logger.info("Redis client not initialized. Falling back to in-memory asynchronous background task execution.")
            try:
                import asyncio
                from app.worker.worker import process_task
                from app.db.database import get_mongodb
                db = get_mongodb()
                # Run the process_task on the running event loop as a background task
                asyncio.create_task(process_task(payload, db))
                return True
            except Exception as fe:
                logger.error(f"Failed to launch in-memory background task fallback: {fe}")
                return False
        
        try:
            serialized_payload = json.dumps(payload, default=str)
            await redis_client.rpush(self.queue_name, serialized_payload)
            logger.info(f"Pushed task to queue '{self.queue_name}': {serialized_payload}")
            return True
        except Exception as e:
            logger.error(f"Failed to push task to Redis queue: {e}")
            return False


    async def pop(self, timeout: int = 0) -> Optional[Dict[str, Any]]:
        """
        Pop a task payload from the left side of the list (FIFO).
        If timeout is specified, blocks using BLPOP.
        """
        redis_client = get_redis()
        if not redis_client:
            logger.error("Redis client is not initialized. Cannot pop from queue.")
            return None
        
        try:
            if timeout > 0:
                result = await redis_client.blpop(self.queue_name, timeout=timeout)
                if result:
                    _, value = result
                    return json.loads(value)
            else:
                value = await redis_client.lpop(self.queue_name)
                if value:
                    return json.loads(value)
        except Exception as e:
            logger.error(f"Failed to pop task from Redis queue: {e}")
            
        return None

    async def get_size(self) -> int:
        """
        Get the number of pending tasks in the queue.
        """
        redis_client = get_redis()
        if not redis_client:
            return 0
        try:
            return await redis_client.llen(self.queue_name)
        except Exception:
            return 0
