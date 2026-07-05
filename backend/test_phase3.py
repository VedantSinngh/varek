import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@varek.in"
ADMIN_PASSWORD = "adminpassword"

async def test_inventory_small_adjustment(client: httpx.AsyncClient, headers: dict):
    print("\n--- 1. Testing Inventory Agent: Small Adjustment (Auto-executes) ---")
    payload = {
        "title": "Restock minimal shirt items",
        "description": "Restock 15 units of minimal shirt SKU SH-LN-MIN-001",
        "priority": 2,
        "payload": {
            "sku": "SH-LN-MIN-001",
            "quantity": 15
        },
        "requires_approval": False,
        "target_agent": "inventory"
    }
    
    # Create task
    res = await client.post("/tasks", json=payload, headers=headers)
    assert res.status_code == 201, f"Task creation failed: {res.text}"
    task = res.json()
    task_id = task["task_id"]
    print(f"Task created: {task_id}, Status: {task['status']}")
    
    # Poll task
    for i in range(12):
        await asyncio.sleep(0.5)
        res = await client.get(f"/tasks/{task_id}", headers=headers)
        task = res.json()
        print(f"Polling status (attempt {i+1}): {task['status']}")
        if task["status"] in ("completed", "failed"):
            break
            
    print(f"Final Task Status: {task['status']}")
    print(f"Agent Output: {task.get('result', {}).get('output')}")
    assert task["status"] == "completed"
    return task_id

async def test_inventory_large_restock(client: httpx.AsyncClient, headers: dict):
    print("\n--- 2. Testing Inventory Agent: Large Restock (Gated by Manual Approval) ---")
    payload = {
        "title": "Bulk Restock minimal linen shirts",
        "description": "Stock levels critical. Propose restocking 150 items of SKU SH-LN-MIN-001",
        "priority": 4,
        "payload": {
            "sku": "SH-LN-MIN-001",
            "quantity": 150
        },
        "requires_approval": True,
        "target_agent": "inventory"
    }
    
    # Create task
    res = await client.post("/tasks", json=payload, headers=headers)
    assert res.status_code == 201
    task = res.json()
    task_id = task["task_id"]
    print(f"Task created: {task_id}, Status: {task['status']}")
    
    # Poll to verify it pauses at awaiting_approval
    await asyncio.sleep(1.0)
    res = await client.get(f"/tasks/{task_id}", headers=headers)
    task = res.json()
    print(f"Status after 1s: {task['status']} (Expected: awaiting_approval)")
    assert task["status"] == "awaiting_approval"
    print(f"Pending tool details: {task.get('pending_tool_call')}")
    
    # Approve task
    print(f"Approving task {task_id}...")
    app_res = await client.post(f"/tasks/{task_id}/approve", headers=headers)
    assert app_res.status_code == 200
    
    # Poll to see it complete
    for i in range(12):
        await asyncio.sleep(0.5)
        res = await client.get(f"/tasks/{task_id}", headers=headers)
        task = res.json()
        print(f"Polling status (attempt {i+1}): {task['status']}")
        if task["status"] in ("completed", "failed"):
            break
            
    print(f"Final Task Status: {task['status']}")
    print(f"Final Output: {task.get('result', {}).get('output')}")
    assert task["status"] == "completed"
    return task_id

async def test_support_refund_request(client: httpx.AsyncClient, headers: dict):
    print("\n--- 3. Testing Support Agent: Refund Request (Gated by Approval) ---")
    payload = {
        "title": "Customer damaged item refund",
        "description": "Customer order #789 arrived damaged. Claiming full refund of $60",
        "priority": 3,
        "payload": {
            "order_id": "789",
            "amount": 60.0
        },
        "requires_approval": True,
        "target_agent": "support"
    }
    
    # Create task
    res = await client.post("/tasks", json=payload, headers=headers)
    assert res.status_code == 201
    task = res.json()
    task_id = task["task_id"]
    print(f"Task created: {task_id}, Status: {task['status']}")
    
    # Poll to verify it pauses
    await asyncio.sleep(1.0)
    res = await client.get(f"/tasks/{task_id}", headers=headers)
    task = res.json()
    print(f"Status after 1s: {task['status']} (Expected: awaiting_approval)")
    assert task["status"] == "awaiting_approval"
    
    # Approve task
    print(f"Approving refund task {task_id}...")
    app_res = await client.post(f"/tasks/{task_id}/approve", headers=headers)
    assert app_res.status_code == 200
    
    # Poll completion
    for i in range(12):
        await asyncio.sleep(0.5)
        res = await client.get(f"/tasks/{task_id}", headers=headers)
        task = res.json()
        print(f"Polling status (attempt {i+1}): {task['status']}")
        if task["status"] in ("completed", "failed"):
            break
            
    print(f"Final Task Status: {task['status']}")
    print(f"Final Output: {task.get('result', {}).get('output')}")
    assert task["status"] == "completed"
    return task_id

async def verify_memory(client: httpx.AsyncClient, headers: dict):
    print("\n--- 4. Verifying Memory Recall Capabilities ---")
    # In Phase 3, we can check memory via the mongo database commands or simple query logs.
    # Since memory does not have an exposed API router yet, we can query agent logs to confirm memory operations occurred.
    res = await client.get("/agent-logs", headers=headers)
    logs = res.json()
    mem_logs = [log for log in logs if "memory" in log.get("action", "") or "remember" in log.get("action", "")]
    print(f"Found memory activities in agent execution logs: {len(mem_logs)}")
    for ml in mem_logs[:3]:
         print(f"  [{ml['timestamp']}] Agent: {ml['agent_name']} | Action: {ml['action']}")

async def main():
    print("Initializing Phase 3 Agents Loop validation script...")
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Authenticate
        print("Authenticating as admin...")
        try:
            login_res = await client.post("/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
            if login_res.status_code != 200:
                print("Failed to authenticate. Ensure database holds seed accounts.")
                return
        except Exception as e:
            print(f"Connection failed: {e}. Is the docker stack running?")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Execute integration loops
        await test_inventory_small_adjustment(client, headers)
        await test_inventory_large_restock(client, headers)
        await test_support_refund_request(client, headers)
        await verify_memory(client, headers)
        
        print("\nPhase 3 validation successfully executed!")

if __name__ == "__main__":
    asyncio.run(main())
