import pytest
from httpx import AsyncClient
import uuid

# Helper to generate unique emails
def get_unique_email(role="customer"):
    return f"{role}-{uuid.uuid4()}@varek.in"

@pytest.mark.asyncio
async def test_order_placement_and_stock_management(client: AsyncClient, test_db):
    # 1. Register and Login Admin to create a product
    admin_email = get_unique_email("admin")
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Order Test Admin", "email": admin_email, "password": "adminpassword", "role": "admin"}
    )
    admin_login = await client.post("/api/v1/auth/login", data={"username": admin_email, "password": "adminpassword"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Create product with 5 stock items
    sku = f"ORD-SKU-{uuid.uuid4().hex[:6].upper()}"
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Order Test Shirt",
            "description": "Shirt for order testing",
            "category": "Shirts",
            "sizes": ["M"],
            "colors": ["Blue"],
            "price": 1000.0,
            "cost_price": 400.00,
            "sku": sku,
            "stock_quantity": 5,
            "brand_status": "active"
        },
        headers=admin_headers
    )
    product = prod_res.json()
    product_id = product["id"]

    # 2. Register and Login Customer
    cust_email = get_unique_email("customer")
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Order Test Customer",
            "email": cust_email,
            "password": "customerpassword",
            "role": "customer"
        }
    )
    cust_login = await client.post("/api/v1/auth/login", data={"username": cust_email, "password": "customerpassword"})
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    # 3. Place Order (Quantity = 2)
    shipping_address = {
        "street": "123 Test Ave",
        "city": "Bengaluru",
        "state": "Karnataka",
        "zip_code": "560002",
        "country": "India",
        "is_default": True
    }
    order_payload = {
        "shipping_address": shipping_address,
        "items": [
            {
                "product_id": product_id,
                "sku": sku,
                "qty": 2,
                "price_at_purchase": 1000.0
            }
        ]
    }
    
    order_res = await client.post("/api/v1/orders", json=order_payload, headers=cust_headers)
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["total_amount"] == 2000.0
    order_id = order["id"]

    # Check product stock reduced to 3
    get_prod_res = await client.get(f"/api/v1/products/{product_id}")
    assert get_prod_res.json()["stock_quantity"] == 3

    # 4. Fail to order with insufficient stock (Order 4, only 3 left)
    insufficient_payload = {
        "shipping_address": shipping_address,
        "items": [
            {
                "product_id": product_id,
                "sku": sku,
                "qty": 4,
                "price_at_purchase": 1000.0
            }
        ]
    }
    fail_res = await client.post("/api/v1/orders", json=insufficient_payload, headers=cust_headers)
    assert fail_res.status_code == 400
    assert "Insufficient stock" in fail_res.json()["detail"]

    # Check product stock remains 3
    get_prod_res = await client.get(f"/api/v1/products/{product_id}")
    assert get_prod_res.json()["stock_quantity"] == 3

    # 5. Cancel Order and check stock restored to 5
    cancel_res = await client.put(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers=admin_headers
    )
    assert cancel_res.status_code == 200
    
    get_prod_res = await client.get(f"/api/v1/products/{product_id}")
    assert get_prod_res.json()["stock_quantity"] == 5
