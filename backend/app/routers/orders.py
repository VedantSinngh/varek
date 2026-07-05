from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
import os
from app.core.dependencies import get_current_active_user, get_admin_user

from app.db.database import get_mongodb
from app.models.order import OrderCreate, OrderResponse, OrderStatus, OrderStatusUpdate
from app.models.user import UserInDB, UserRole
from app.services.orders import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_create: OrderCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    return await OrderService.create(db, str(current_user.id), order_create)

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None),
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    # Customer can only see their own orders; admin can view all
    if current_user.role in (UserRole.ADMIN, UserRole.FOUNDER):
        return await OrderService.list_orders(db, skip=skip, limit=limit, status=status)
    else:
        return await OrderService.list_orders(
            db,
            skip=skip,
            limit=limit,
            user_id=str(current_user.id),
            status=status
        )

@router.get("/refunds")
async def list_refunds(
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    cursor = db.refunds.find().sort("created_at", -1)
    refunds = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        refunds.append(doc)
    return refunds

@router.get("/{order_id}", response_model=OrderResponse)

async def get_order(
    order_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    # Check permissions
    if current_user.role not in (UserRole.ADMIN, UserRole.FOUNDER) and order.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this order"
        )
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    order = await OrderService.update_status(db, order_id, status_update)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order

import stripe
import uuid
from app.models.task import TaskStatus
from app.services.products import ProductService
from fastapi import Request

# Stripe Test key config
stripe.api_key = status_update = None # placeholder reference clear
stripe.api_key = get_current_active_user = None # reference clear
stripe.api_key = get_mongodb = None # reference clear
import os
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")

@router.post("/create-payment-intent")
async def create_payment_intent(
    order_create: OrderCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db=Depends(get_mongodb)
):
    total_amount = 0.0
    for item in order_create.items:
        product = await ProductService.get_by_id(db, item.product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {item.product_id} not found")
        if product.stock_quantity < item.qty:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for {product.name}")
        total_amount += product.price * item.qty
        
    amount_in_cents = int(total_amount * 100)
    
    try:
        stripe_key = os.getenv("STRIPE_SECRET_KEY")
        if stripe_key:
            stripe.api_key = stripe_key
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency="usd",
                metadata={"user_id": str(current_user.id)}
            )
            client_secret = intent.client_secret
            payment_intent_id = intent.id
        else:
            client_secret = "pi_mock_secret_" + str(uuid.uuid4())
            payment_intent_id = "pi_mock_" + str(uuid.uuid4())
            
        order_dict = order_create.model_dump()
        order_dict["user_id"] = str(current_user.id)
        order_dict["status"] = OrderStatus.PENDING
        order_dict["payment_status"] = "pending"
        order_dict["total_amount"] = total_amount
        order_dict["payment_ref"] = payment_intent_id
        order_dict["created_at"] = datetime.utcnow()
        order_dict["updated_at"] = datetime.utcnow()
        
        for idx, item in enumerate(order_create.items):
            product = await ProductService.get_by_id(db, item.product_id)
            order_dict["items"][idx]["sku"] = product.sku
            order_dict["items"][idx]["price_at_purchase"] = product.price
            
        result = await db.orders.insert_one(order_dict)
        return {
            "clientSecret": client_secret,
            "order_id": str(result.inserted_id),
            "payment_intent_id": payment_intent_id
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db=Depends(get_mongodb)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    event = None
    try:
        if webhook_secret and sig_header:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Webhook parsing error: {e}")
        
    event_type = event.get("type") if isinstance(event, dict) else event.type
    event_data = event.get("data") if isinstance(event, dict) else event.data
    
    if event_type == "payment_intent.succeeded":
        intent = event_data.get("object") if isinstance(event_data, dict) else event_data.object
        payment_intent_id = intent.get("id")
        
        order_dict = await db.orders.find_one({"payment_ref": payment_intent_id})
        if order_dict:
            from app.models.order import OrderInDB
            order = OrderInDB(**order_dict)
            if order.status == OrderStatus.PENDING:
                await db.orders.update_one(
                    {"_id": order_dict["_id"]},
                    {
                        "$set": {
                            "status": OrderStatus.CONFIRMED,
                            "payment_status": "paid",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                for item in order.items:
                    success = await ProductService.adjust_stock(db, item.product_id, -item.qty)
                    if success:
                        prod = await ProductService.get_by_id(db, item.product_id)
                        if prod and prod.stock_quantity < 10:
                            task_id_str = str(uuid.uuid4())
                            task_doc = {
                                "task_id": task_id_str,
                                "title": f"Low Stock Alert: {prod.sku}",
                                "description": f"Product '{prod.name}' stock level is currently {prod.stock_quantity}. Restock recommended.",
                                "priority": 3,
                                "payload": {"sku": prod.sku, "quantity": 150},
                                "requires_approval": True,
                                "target_agent": "inventory",
                                "status": TaskStatus.QUEUED,
                                "created_by": "system",
                                "created_at": datetime.utcnow(),
                                "updated_at": datetime.utcnow(),
                                "status_history": [{
                                    "status": TaskStatus.QUEUED,
                                    "timestamp": datetime.utcnow(),
                                    "details": "Triggered automatically by webhook stock reduction"
                                }]
                            }
                            await db.tasks.insert_one(task_doc)
                            from app.agents.executive_agent import ExecutiveAgent
                            await ExecutiveAgent.receive_task(task_id_str, db)
                            
    return {"status": "success"}

