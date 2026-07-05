import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import UserRole
from app.models.product import BrandStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    logger.info("Connecting to MongoDB for seeding...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db_name = settings.MONGO_URI.split("/")[-1].split("?")[0]
    if not db_name:
        db_name = "varek"
    db = client[db_name]
    
    # 1. Seed Users
    logger.info("Seeding users...")
    await db.users.delete_many({}) # clear existing
    
    users_to_seed = [
        {
            "name": "Admin User",
            "email": "admin@varek.in",
            "hashed_password": get_password_hash("adminpassword"),
            "role": UserRole.ADMIN,
            "addresses": [
                {
                    "street": "123 Admin Lane",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "zip_code": "400001",
                    "country": "India",
                    "is_default": True
                }
            ],
            "phone": "+919876543210",
            "is_active": True
        },
        {
            "name": "Founder User",
            "email": "founder@varek.in",
            "hashed_password": get_password_hash("founderpassword"),
            "role": UserRole.FOUNDER,
            "addresses": [],
            "phone": "+919876543211",
            "is_active": True
        },
        {
            "name": "Customer User",
            "email": "customer@varek.in",
            "hashed_password": get_password_hash("customerpassword"),
            "role": UserRole.CUSTOMER,
            "addresses": [
                {
                    "street": "456 Customer Road",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "zip_code": "560001",
                    "country": "India",
                    "is_default": True
                }
            ],
            "phone": "+919876543212",
            "is_active": True
        }
    ]
    
    for u in users_to_seed:
        await db.users.insert_one(u)
        logger.info(f"Seeded user: {u['email']}")
        
    # 2. Seed Products
    logger.info("Seeding products...")
    await db.products.delete_many({}) # clear existing
    
    products_to_seed = [
        {
            "name": "Minimalist Linen Shirt",
            "description": "Premium breathable linen shirt for daily wear.",
            "category": "Shirts",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["White", "Beige", "Olive"],
            "price": 2499.00,
            "cost_price": 800.00,
            "sku": "SH-LN-MIN-001",
            "stock_quantity": 50,
            "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c"],
            "tags": ["linen", "minimalist", "summer", "breathable"],
            "brand_status": BrandStatus.ACTIVE,
            "is_deleted": False
        },
        {
            "name": "Classic Indigo Denim",
            "description": "Slim-fit raw indigo denim jeans.",
            "category": "Jeans",
            "sizes": ["30", "32", "34", "36"],
            "colors": ["Indigo Blue"],
            "price": 3999.00,
            "cost_price": 1200.00,
            "sku": "JN-DN-IND-002",
            "stock_quantity": 30,
            "images": ["https://images.unsplash.com/photo-1542272604-787c3835535d"],
            "tags": ["denim", "raw", "classic", "slim-fit"],
            "brand_status": BrandStatus.ACTIVE,
            "is_deleted": False
        },
        {
            "name": "Oversized Cotton Tee",
            "description": "Heavyweight organic cotton tee.",
            "category": "T-Shirts",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Black", "Heather Grey", "Sand"],
            "price": 1499.00,
            "cost_price": 450.00,
            "sku": "TS-CO-OVR-003",
            "stock_quantity": 100,
            "images": ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518"],
            "tags": ["cotton", "oversized", "streetwear", "heavyweight"],
            "brand_status": BrandStatus.ACTIVE,
            "is_deleted": False
        },
        {
            "name": "Unreleased Tech Parka",
            "description": "Waterproof tech-wear jacket for rainy seasons. Draft status product.",
            "category": "Jackets",
            "sizes": ["M", "L"],
            "colors": ["Matte Black"],
            "price": 8999.00,
            "cost_price": 3200.00,
            "sku": "JK-PK-TEC-004",
            "stock_quantity": 10,
            "images": [],
            "tags": ["techwear", "waterproof", "premium"],
            "brand_status": BrandStatus.DRAFT,
            "is_deleted": False
        }
    ]
    
    for p in products_to_seed:
        await db.products.insert_one(p)
        logger.info(f"Seeded product: {p['name']} (SKU: {p['sku']})")
        
    client.close()
    logger.info("Seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())
