import logging
from datetime import datetime
from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.services.products import ProductService

logger = logging.getLogger(__name__)

# --- Python tools callables ---
async def check_stock_level(db, sku: str) -> Dict[str, Any]:
    product = await ProductService.get_by_sku(db, sku)
    if not product:
        return {"error": f"Product with SKU '{sku}' not found"}
    return {
        "sku": sku,
        "name": product.name,
        "stock_quantity": product.stock_quantity,
        "brand_status": product.brand_status
    }

async def update_stock(db, sku: str, quantity_delta: int, reason: str) -> Dict[str, Any]:
    product = await ProductService.get_by_sku(db, sku)
    if not product:
        return {"error": f"Product with SKU '{sku}' not found"}
        
    success = await ProductService.adjust_stock(db, str(product.id), quantity_delta)
    if not success:
        return {
            "success": False,
            "error": "Failed to adjust stock. Insufficient stock capacity or DB write error.",
            "current_stock": product.stock_quantity
        }
        
    updated = await ProductService.get_by_sku(db, sku)
    return {
        "success": True,
        "sku": sku,
        "previous_stock": product.stock_quantity,
        "new_stock": updated.stock_quantity,
        "reason": reason
    }

async def create_restock_request(db, sku: str, quantity: int, supplier_note: str) -> Dict[str, Any]:
    product = await ProductService.get_by_sku(db, sku)
    if not product:
        return {"error": f"Product with SKU '{sku}' not found"}
        
    request_doc = {
        "sku": sku,
        "product_name": product.name,
        "quantity": quantity,
        "supplier_note": supplier_note,
        "status": "pending_approval",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.restock_requests.insert_one(request_doc)
    request_doc["_id"] = str(result.inserted_id)
    return {
        "success": True,
        "request_id": request_doc["_id"],
        "sku": sku,
        "quantity": quantity,
        "status": "pending_approval"
    }

# --- Inventory Agent Definition ---
class InventoryAgent(BaseAgent):
    def __init__(self, db):
        super().__init__("inventory", db)
        
        # Tool: Check Stock Level
        self.register_tool(
            name="check_stock_level",
            description="Query the product database to inspect current stock levels for a given SKU.",
            input_schema={
                "type": "object",
                "properties": {
                    "sku": {
                        "type": "string",
                        "description": "Unique Stock Keeping Unit code (e.g. SH-LN-MIN-001)"
                    }
                },
                "required": ["sku"]
            },
            func=check_stock_level
        )
        
        # Tool: Update Stock
        self.register_tool(
            name="update_stock",
            description="Adjust stock levels directly (increase for restocking, negative decrease for damage write-offs).",
            input_schema={
                "type": "object",
                "properties": {
                    "sku": {
                        "type": "string",
                        "description": "Unique SKU identifier"
                    },
                    "quantity_delta": {
                        "type": "integer",
                        "description": "Stock adjustment delta (e.g. 10 to add, -5 to subtract)"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Audit reason for the stock adjustment (e.g. 'damaged item write-off')"
                    }
                },
                "required": ["sku", "quantity_delta", "reason"]
            },
            func=update_stock
        )
        
        # Tool: Create Restock Request
        self.register_tool(
            name="create_restock_request",
            description="Create a formal supplier restock order request in the database.",
            input_schema={
                "type": "object",
                "properties": {
                    "sku": {
                        "type": "string",
                        "description": "Unique SKU code"
                    },
                    "quantity": {
                        "type": "integer",
                        "description": "Number of units to request from supplier"
                    },
                    "supplier_note": {
                        "type": "string",
                        "description": "Special directions or notes for the supplier invoice"
                    }
                },
                "required": ["sku", "quantity", "supplier_note"]
            },
            func=create_restock_request
        )
