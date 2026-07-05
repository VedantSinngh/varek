from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import connect_to_databases, close_database_connections, get_mongodb, get_redis
from app.routers import auth, users, products, orders, tasks, agent_logs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and Redis
    await connect_to_databases()
    yield
    # Shutdown: Close database connections
    await close_database_connections()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(agent_logs.router, prefix=settings.API_V1_STR)

@app.get("/health", status_code=status.HTTP_200_OK, tags=["system"])
async def health_check():
    """
    Check connectivity to MongoDB and Redis.
    """
    mongo_ok = False
    redis_ok = False
    details = {}

    # Check Mongo
    try:
        mongo_db = get_mongodb()
        # issue a simple command to verify connection
        res = await mongo_db.command("ping")
        if res.get("ok") == 1.0:
            mongo_ok = True
        else:
            details["mongo"] = "Ping failed"
    except Exception as e:
        details["mongo"] = f"Connection error: {e}"

    # Check Redis
    try:
        redis_client = get_redis()
        if redis_client:
            res = await redis_client.ping()
            if res:
                redis_ok = True
            else:
                details["redis"] = "Ping failed"
        else:
            details["redis"] = "Not initialized"
    except Exception as e:
        details["redis"] = f"Connection error: {e}"

    if not mongo_ok or not redis_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "unhealthy", "components": details}
        )

    return {
        "status": "healthy",
        "database": "mongodb: OK",
        "cache": "redis: OK"
    }
