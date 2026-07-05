from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import List, Optional
from app.core.dependencies import get_admin_user, get_current_active_user
from app.db.cache import cache_response
from app.db.database import get_mongodb
from app.models.product import ProductCreate, ProductResponse, ProductUpdate, ProductInDB
from app.models.user import UserInDB, UserRole
from app.services.products import ProductService

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_create: ProductCreate,
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    # Check if SKU already exists
    existing = await ProductService.get_by_sku(db, product_create.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_create.sku}' already exists"
        )
    return await ProductService.create(db, product_create)

@router.get("", response_model=List[ProductResponse])
@cache_response(expire_seconds=60)
async def list_products(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: Optional[str] = Query(None),
    db=Depends(get_mongodb)
):
    # public product list returns only active status products
    return await ProductService.list_products(
        db,
        skip=skip,
        limit=limit,
        category=category,
        tag=tag,
        min_price=min_price,
        max_price=max_price,
        include_drafts=False,
        sort_by=sort_by
    )


@router.get("/admin", response_model=List[ProductResponse])
async def list_products_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    # Admin can list drafts, and we don't cache admin listing
    return await ProductService.list_products(
        db,
        skip=skip,
        limit=limit,
        category=category,
        tag=tag,
        include_drafts=True
    )

@router.get("/restock-requests")
async def list_restock_requests(
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    cursor = db.restock_requests.find().sort("created_at", -1)
    requests = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        requests.append(doc)
    return requests

@router.get("/{product_id}", response_model=ProductResponse)

@cache_response(expire_seconds=60)
async def get_product(
    request: Request,
    product_id: str,
    db=Depends(get_mongodb)
):
    product = await ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    if product_update.sku:
        existing = await ProductService.get_by_sku(db, product_update.sku)
        if existing and str(existing.id) != product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU '{product_update.sku}' is already taken by another product"
            )
            
    product = await ProductService.update(db, product_id, product_update)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_admin: UserInDB = Depends(get_admin_user),
    db=Depends(get_mongodb)
):
    success = await ProductService.soft_delete(db, product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return

