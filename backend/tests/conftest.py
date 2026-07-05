import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.main import app
from app.db.database import connect_to_databases, close_database_connections, get_mongodb

@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_db():
    await connect_to_databases()
    yield
    await close_database_connections()

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def test_db():
    return get_mongodb()
