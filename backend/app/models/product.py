from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.common import PyObjectId

class BrandStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"

class ProductBase(BaseModel):
    name: str
    description: str
    category: str
    sizes: List[str]
    colors: List[str]
    price: float
    cost_price: float
    sku: str
    stock_quantity: int
    images: List[str] = []
    tags: List[str] = []
    brand_status: BrandStatus = BrandStatus.DRAFT

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    stock_quantity: Optional[int] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    brand_status: Optional[BrandStatus] = None

class ProductInDB(ProductBase):
    id: PyObjectId = Field(default=None, alias="_id")
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class ProductResponse(ProductBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
