import json
import logging
from functools import wraps
from fastapi import Request
from app.db.database import get_redis

logger = logging.getLogger(__name__)

def cache_response(expire_seconds: int = 300):
    """
    Decorator to cache responses in Redis.
    Looks for a `Request` object in args or kwargs to construct a cache key based on the URL.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis_client = get_redis()
            if not redis_client:
                return await func(*args, **kwargs)
            
            # Try to find Request object
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if request:
                query_str = json.dumps(dict(request.query_params), sort_keys=True)
                cache_key = f"cache:{request.url.path}:{query_str}"
            else:
                # Generate key based on func name and serializable kwargs
                serializable_kwargs = {}
                for k, v in kwargs.items():
                    if k in ("db", "current_user", "redis_client", "request"):
                        continue
                    serializable_kwargs[k] = str(v)
                cache_key = f"cache:{func.__name__}:{json.dumps(serializable_kwargs, sort_keys=True)}"
            
            try:
                cached_data = await redis_client.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.error(f"Redis cache read error: {e}")
            
            result = await func(*args, **kwargs)
            
            try:
                serializable = result
                # Serialize Pydantic objects or list of Pydantic objects
                if hasattr(result, "model_dump"):
                    serializable = result.model_dump(by_alias=True)
                elif isinstance(result, list):
                    serializable = [
                        item.model_dump(by_alias=True) if hasattr(item, "model_dump") else item
                        for item in result
                    ]
                
                await redis_client.setex(
                    cache_key,
                    expire_seconds,
                    json.dumps(serializable, default=str)
                )
                logger.debug(f"Cache stored for key: {cache_key}")
            except Exception as e:
                logger.error(f"Redis cache write error: {e}")
                
            return result
        return wrapper
    return decorator
