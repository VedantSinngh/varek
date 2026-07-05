from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.common import PyObjectId
from app.models.user import Address

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class OrderItem(BaseModel):
    product_id: str
    sku: str
    qty: int
    price_at_purchase: float

class OrderBase(BaseModel):
    shipping_address: Address
    payment_ref: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItem]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: Optional[str] = None

class OrderInDB(OrderBase):
    id: PyObjectId = Field(default=None, alias="_id")
    user_id: str
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    payment_status: str = "pending"
    total_amount: float
    tracking_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class OrderResponse(OrderInDB):
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        # In Pydantic v2, order response must serialize correctly
