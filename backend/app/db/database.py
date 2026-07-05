import logging
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    mongo_client: AsyncIOMotorClient = None
    redis_client: aioredis.Redis = None

db = Database()

async def connect_to_databases():
    # Connect to MongoDB
    logger.info("Connecting to MongoDB...")
    db.mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    logger.info("Connected to MongoDB successfully.")

    # Create collection indexes
    try:
        await create_indexes()
        logger.info("MongoDB indexes verified/created successfully.")
    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes: {e}")

    # Connect to Redis
    logger.info("Connecting to Redis...")
    db.redis_client = aioredis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    logger.info("Connected to Redis successfully.")

async def create_indexes():
    db_conn = get_mongodb()
    
    # Users indexes
    await db_conn.users.create_index("email", unique=True)
    await db_conn.users.create_index("role")
    
    # Products indexes
    await db_conn.products.create_index("sku", unique=True)
    await db_conn.products.create_index("category")
    await db_conn.products.create_index("tags")
    await db_conn.products.create_index("price")
    await db_conn.products.create_index("brand_status")
    
    # Orders indexes
    await db_conn.orders.create_index("user_id")
    await db_conn.orders.create_index("status")
    await db_conn.orders.create_index("created_at")
    
    # Tasks indexes
    await db_conn.tasks.create_index("task_id", unique=True)
    await db_conn.tasks.create_index("status")
    await db_conn.tasks.create_index("priority")
    await db_conn.tasks.create_index("created_at")
    
    # Agent logs indexes
    await db_conn.agent_logs.create_index("agent_name")
    await db_conn.agent_logs.create_index("status")
    await db_conn.agent_logs.create_index("related_task_id")
    await db_conn.agent_logs.create_index("timestamp")

async def close_database_connections():
    if db.mongo_client:
        db.mongo_client.close()
        logger.info("Closed MongoDB connection.")
    if db.redis_client:
        await db.redis_client.close()
        logger.info("Closed Redis connection.")

def get_mongodb():
    # Return the db object from MONGO_URI
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0]
    if not db_name:
        db_name = "varek"
    return db.mongo_client[db_name]

def get_redis():
    return db.redis_client
