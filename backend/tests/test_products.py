import pytest
from httpx import AsyncClient
import uuid

# Helper to generate unique emails so tests can run repeatedly
def get_unique_email():
    return f"admin-{uuid.uuid4()}@varek.in"

@pytest.mark.asyncio
async def test_product_crud_flow(client: AsyncClient, test_db):
    # 1. Register Admin User
    admin_email = get_unique_email()
    reg_response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Admin",
            "email": admin_email,
            "password": "testpassword123",
            "role": "admin"
        }
    )
    assert reg_response.status_code == 201
    
    # 2. Login to get JWT
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": admin_email,
            "password": "testpassword123"
        }
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Product
    sku = f"TST-SKU-{uuid.uuid4().hex[:6].upper()}"
    prod_data = {
        "name": "Test Cotton Pants",
        "description": "Super soft cotton pants.",
        "category": "Pants",
        "sizes": ["M", "L"],
        "colors": ["Grey"],
        "price": 1999.00,
        "cost_price": 600.00,
        "sku": sku,
        "stock_quantity": 40,
        "images": [],
        "tags": ["cotton", "pants"],
        "brand_status": "active"
    }
    
    create_res = await client.post("/api/v1/products", json=prod_data, headers=headers)
    assert create_res.status_code == 201
    product = create_res.json()
    assert product["name"] == "Test Cotton Pants"
    product_id = product["id"]
    
    # 4. List Products (Public)
    list_res = await client.get("/api/v1/products")
    assert list_res.status_code == 200
    products = list_res.json()
    assert len(products) > 0
    assert any(p["id"] == product_id for p in products)
    
    # 5. Get Product by ID
    get_res = await client.get(f"/api/v1/products/{product_id}")
    assert get_res.status_code == 200
    assert get_res.json()["sku"] == sku
    
    # 6. Update Product
    update_res = await client.put(
        f"/api/v1/products/{product_id}",
        json={"price": 2199.00, "stock_quantity": 35},
        headers=headers
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["price"] == 2199.00
    assert updated["stock_quantity"] == 35
    
    # 7. Soft Delete Product
    del_res = await client.delete(f"/api/v1/products/{product_id}", headers=headers)
    assert del_res.status_code == 204
    
    # 8. Check that it doesn't show up in listings or fetch by ID
    get_del_res = await client.get(f"/api/v1/products/{product_id}")
    assert get_del_res.status_code == 404
