from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.models.order import OrderCreate, OrderInDB, OrderStatus, OrderStatusUpdate
from app.services.products import ProductService
from datetime import datetime

class OrderService:
    @staticmethod
    async def get_by_id(db, order_id: str) -> Optional[OrderInDB]:
        if not ObjectId.is_valid(order_id):
            return None
        order_dict = await db.orders.find_one({"_id": ObjectId(order_id)})
        if order_dict:
            return OrderInDB(**order_dict)
        return None

    @staticmethod
    async def create(db, user_id: str, order_create: OrderCreate) -> OrderInDB:
        # Resolve prices, verify stock, and perform stock reduction
        allocated_items = []
        total_amount = 0.0
        
        for item in order_create.items:
            product = await ProductService.get_by_id(db, item.product_id)
            if not product:
                # Revert any allocated stock before failing
                await OrderService._revert_stock(db, allocated_items)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with ID {item.product_id} not found"
                )
            
            # Atomic stock reduction
            success = await ProductService.adjust_stock(db, item.product_id, -item.qty)
            if not success:
                await OrderService._revert_stock(db, allocated_items)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku})"
                )
            
            # Store price at purchase and sku to avoid discrepancies if product price changes later
            item.sku = product.sku
            item.price_at_purchase = product.price
            allocated_items.append((item.product_id, item.qty))
            total_amount += product.price * item.qty
            
        order_dict = order_create.model_dump()
        order_dict["user_id"] = user_id
        order_dict["status"] = OrderStatus.PENDING
        order_dict["payment_status"] = "pending"
        order_dict["total_amount"] = total_amount
        order_dict["created_at"] = datetime.utcnow()
        order_dict["updated_at"] = datetime.utcnow()
        
        result = await db.orders.insert_one(order_dict)
        order_dict["_id"] = result.inserted_id
        return OrderInDB(**order_dict)

    @staticmethod
    async def _revert_stock(db, allocated_items: List[tuple]):
        for prod_id, qty in allocated_items:
            await ProductService.adjust_stock(db, prod_id, qty)

    @staticmethod
    async def update_status(db, order_id: str, status_update: OrderStatusUpdate) -> Optional[OrderInDB]:
        if not ObjectId.is_valid(order_id):
            return None
            
        order = await OrderService.get_by_id(db, order_id)
        if not order:
            return None
            
        update_data = status_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # If order is being cancelled, restore product stock
        if status_update.status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED:
            for item in order.items:
                await ProductService.adjust_stock(db, item.product_id, item.qty)
                
        result = await db.orders.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            return OrderInDB(**result)
        return None

    @staticmethod
    async def list_orders(
        db,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
        status: Optional[OrderStatus] = None
    ) -> List[OrderInDB]:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if status:
            query["status"] = status
            
        cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
        orders = []
        async for order_dict in cursor:
            orders.append(OrderInDB(**order_dict))
        return orders
