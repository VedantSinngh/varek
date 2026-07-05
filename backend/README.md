# Varek.in Backend (AI-First Clothing Brand Platform) - Phase 1

This is the backend and data layer for the Varek.in platform. Phase 1 provides the production-ready foundations for future AI agents and frontend clients to plug into.

## Tech Stack
- **Framework:** Python + FastAPI (async)
- **Database:** MongoDB (via Motor async driver)
- **Cache/Queue:** Redis (for response caching and task queuing)
- **Authentication:** JWT-based access + refresh tokens
- **Data Validation:** Pydantic v2
- **Containerization:** Docker + docker-compose

---

## Directory Structure
```
backend/
├── app/
│   ├── main.py                # App initialization & lifespan
│   ├── core/
│   │   ├── config.py          # Environment settings
│   │   ├── security.py        # Hashing & JWT logic
│   │   └── dependencies.py    # FastAPI dependencies
│   ├── db/
│   │   ├── database.py        # MongoDB/Redis clients & index creation
│   │   └── cache.py           # Redis response caching decorator
│   ├── models/                # Pydantic schemas (User, Product, Order, Task, AgentLog)
│   ├── routers/               # API endpoints matching resource operations
│   ├── services/              # Business logic services
│   └── utils/
│       └── queue.py           # Redis simple FIFO queue utility
├── tests/                     # Pytest suite for products and orders
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── seed.py                    # Seeding script for sample data
└── README.md
```

---

## Setup & Running

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (if running locally without Docker)

### Option 1: Running with Docker Compose (Recommended)

1. Clone or copy the repository files.
2. In the `backend` folder, run:
   ```bash
   docker-compose up --build
   ```
3. The API will start on `http://localhost:8000`.
4. Open Swagger UI at `http://localhost:8000/api/v1/docs` to interact with the endpoints.

### Option 2: Running Locally (Development)

1. Navigate to the `backend/` folder.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Make sure you have **MongoDB** and **Redis** instances running on your system (e.g., local installations or Docker containers running `mongo:6.0` and `redis:7.0`).
5. Create a local `.env` file (copied from `.env.example`):
   ```bash
   cp .env.example .env
   ```
6. Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn app.main:app --reload
   ```

---

## Database Seeding
To populate the database with default customer, admin, founder accounts, and sample products:

- **Using Docker:**
  ```bash
  docker-compose exec app python seed.py
  ```
- **Locally:**
  ```bash
  python seed.py
  ```

### Seeded Credentials:
- **Admin:** `admin@varek.in` / `adminpassword`
- **Founder:** `founder@varek.in` / `founderpassword`
- **Customer:** `customer@varek.in` / `customerpassword`

---

## Running Tests
Tests are implemented using `pytest` and `pytest-asyncio`. Make sure local instances of MongoDB and Redis are running, or run the tests inside the container.

- **Using Docker:**
  ```bash
  docker-compose exec app pytest
  ```
- **Locally:**
  ```bash
  pytest
  ```
