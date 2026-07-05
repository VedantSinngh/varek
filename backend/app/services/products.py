from typing import List, Optional
from bson import ObjectId
from app.models.product import ProductCreate, ProductInDB, ProductUpdate, BrandStatus
from datetime import datetime

class ProductService:
    @staticmethod
    async def get_by_id(db, product_id: str) -> Optional[ProductInDB]:
        if not ObjectId.is_valid(product_id):
            return None
        product_dict = await db.products.find_one({"_id": ObjectId(product_id), "is_deleted": {"$ne": True}})
        if product_dict:
            return ProductInDB(**product_dict)
        return None

    @staticmethod
    async def get_by_sku(db, sku: str) -> Optional[ProductInDB]:
        product_dict = await db.products.find_one({"sku": sku, "is_deleted": {"$ne": True}})
        if product_dict:
            return ProductInDB(**product_dict)
        return None

    @staticmethod
    async def create(db, product_create: ProductCreate) -> ProductInDB:
        product_dict = product_create.model_dump()
        product_dict["is_deleted"] = False
        product_dict["created_at"] = datetime.utcnow()
        product_dict["updated_at"] = datetime.utcnow()
        
        result = await db.products.insert_one(product_dict)
        product_dict["_id"] = result.inserted_id
        return ProductInDB(**product_dict)

    @staticmethod
    async def update(db, product_id: str, product_update: ProductUpdate) -> Optional[ProductInDB]:
        if not ObjectId.is_valid(product_id):
            return None
        
        update_data = product_update.model_dump(exclude_unset=True)
        if not update_data:
            return await ProductService.get_by_id(db, product_id)
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.products.find_one_and_update(
            {"_id": ObjectId(product_id), "is_deleted": {"$ne": True}},
            {"$set": update_data},
            return_document=True
        )
        if result:
            return ProductInDB(**result)
        return None

    @staticmethod
    async def soft_delete(db, product_id: str) -> bool:
        if not ObjectId.is_valid(product_id):
            return False
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id), "is_deleted": {"$ne": True}},
            {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    @staticmethod
    async def list_products(
        db,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        tag: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        include_drafts: bool = False,
        sort_by: Optional[str] = None
    ) -> List[ProductInDB]:
        query = {"is_deleted": {"$ne": True}}
        
        if not include_drafts:
            query["brand_status"] = BrandStatus.ACTIVE
            
        if category:
            query["category"] = category
        if tag:
            query["tags"] = tag
            
        if min_price is not None or max_price is not None:
            price_query = {}
            if min_price is not None:
                price_query["$gte"] = min_price
            if max_price is not None:
                price_query["$lte"] = max_price
            query["price"] = price_query
            
        cursor = db.products.find(query)
        
        # Apply sorting
        if sort_by == "price_asc":
            cursor = cursor.sort("price", 1)
        elif sort_by == "price_desc":
            cursor = cursor.sort("price", -1)
        elif sort_by == "newest":
            cursor = cursor.sort("created_at", -1)
            
        cursor = cursor.skip(skip).limit(limit)
        products = []
        async for product_dict in cursor:
            products.append(ProductInDB(**product_dict))
        return products

        
    @staticmethod
    async def adjust_stock(db, product_id: str, qty_change: int) -> bool:
        """
        Adjust stock quantity of a product. If stock goes below 0, transaction fails.
        `qty_change` can be negative (stock reduction) or positive (restock).
        """
        if not ObjectId.is_valid(product_id):
            return False
        
        # Use atomic update to prevent race conditions
        query = {
            "_id": ObjectId(product_id),
            "is_deleted": {"$ne": True}
        }
        if qty_change < 0:
            query["stock_quantity"] = {"$gte": abs(qty_change)}
            
        result = await db.products.update_one(
            query,
            {"$inc": {"stock_quantity": qty_change}, "$set": {"updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0
