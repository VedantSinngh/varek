import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@varek.in"
ADMIN_PASSWORD = "adminpassword"

async def test_normal_task_flow(client: httpx.AsyncClient, headers: dict):
    print("\n--- 1. Testing Normal Task Flow ---")
    payload = {
        "title": "Automated SEO Audit",
        "description": "Scan the product category pages for SEO compliance",
        "priority": 3,
        "payload": {"categories": ["Shirts", "Jeans"]},
        "requires_approval": False
    }
    
    # Create task
    res = await client.post("/tasks", json=payload, headers=headers)
    assert res.status_code == 201, f"Create failed: {res.text}"
    task = res.json()
    task_id = task["task_id"]
    print(f"Task created with ID: {task_id}, Status: {task['status']}")
    
    # Poll task status
    for i in range(10):
        await asyncio.sleep(0.5)
        res = await client.get(f"/tasks/{task_id}", headers=headers)
        task = res.json()
        print(f"Polling status (attempt {i+1}): {task['status']}")
        if task["status"] in ("completed", "failed"):
            break
            
    print(f"Final Task Status: {task['status']}")
    print(f"Status History transitions:")
    for h in task.get("status_history", []):
        print(f"  - {h['status']} at {h['timestamp']} ({h.get('details')})")
    assert task["status"] == "completed", "Task should have completed successfully"
    return task_id

async def test_approval_task_flow(client: httpx.AsyncClient, headers: dict):
    print("\n--- 2. Testing Human-In-The-Loop Approval Flow ---")
    payload = {
        "title": "Publish Draft Products",
        "description": "Bulk active all drafts (sensitive action)",
        "priority": 4,
        "payload": {"activate_all": True},
        "requires_approval": True
    }
    
    # Create task
    res = await client.post("/tasks", json=payload, headers=headers)
    assert res.status_code == 201, f"Create failed: {res.text}"
    task = res.json()
    task_id = task["task_id"]
    print(f"Task created with ID: {task_id}, Status: {task['status']}")
    
    # Poll to verify it remains paused
    await asyncio.sleep(1.0)
    res = await client.get(f"/tasks/{task_id}", headers=headers)
    task = res.json()
    print(f"Status after 1 second: {task['status']} (Expected: awaiting_approval)")
    assert task["status"] == "awaiting_approval", "Task should be paused awaiting approval"
    
    # Approve task
    print(f"Approving task: {task_id}...")
    app_res = await client.post(f"/tasks/{task_id}/approve", headers=headers)
    assert app_res.status_code == 200, f"Approval failed: {app_res.text}"
    
    # Poll to see it complete
    for i in range(10):
        await asyncio.sleep(0.5)
        res = await client.get(f"/tasks/{task_id}", headers=headers)
        task = res.json()
        print(f"Polling status (attempt {i+1}): {task['status']}")
        if task["status"] in ("completed", "failed"):
            break
            
    print(f"Final Task Status: {task['status']}")
    assert task["status"] == "completed", "Task should have transitioned and completed"
    return task_id

async def verify_agent_logs(client: httpx.AsyncClient, headers: dict, task_id: str):
    print(f"\n--- 3. Verifying Agent Logs for Task: {task_id} ---")
    res = await client.get(f"/agent-logs?task_id={task_id}", headers=headers)
    assert res.status_code == 200
    logs = res.json()
    print(f"Found {len(logs)} agent log entries:")
    for log in logs:
        print(f"  [{log['timestamp']}] Agent: '{log['agent_name']}' | Action: '{log['action']}' | Status: '{log['status']}'")

async def main():
    print("Initializing Phase 2 skeleton validation script...")
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Authenticate
        print("Authenticating as admin...")
        try:
            login_res = await client.post("/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
            if login_res.status_code != 200:
                print("Failed to authenticate. Ensure the databases are running and seeded (run seed.py).")
                return
        except Exception as e:
            print(f"Connection failed: {e}. Check if uvicorn/docker-compose is running at localhost:8000")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Run test flows
        normal_task_id = await test_normal_task_flow(client, headers)
        approval_task_id = await test_approval_task_flow(client, headers)
        
        # Verify logs
        await verify_agent_logs(client, headers, normal_task_id)
        await verify_agent_logs(client, headers, approval_task_id)
        
        print("\nAll verification checks successfully executed!")

if __name__ == "__main__":
    asyncio.run(main())
