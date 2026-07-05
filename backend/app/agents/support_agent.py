import logging
from datetime import datetime
from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.services.orders import OrderService
from app.core.security import get_mongodb

logger = logging.getLogger(__name__)

# --- Python tools callables ---
async def get_order_status(db, order_id: str) -> Dict[str, Any]:
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        return {"error": f"Order with ID '{order_id}' not found"}
    return {
        "order_id": order_id,
        "status": order.status,
        "payment_status": order.payment_status,
        "total_amount": order.total_amount,
        "tracking_number": order.tracking_number,
        "items": [item.model_dump() for item in order.items]
    }

async def draft_response(db, customer_message: str, order_context: Dict[str, Any]) -> Dict[str, Any]:
    # Formulate a simple polite support answer template
    order_id = order_context.get("order_id", "unknown")
    status = order_context.get("status", "unknown")
    
    reply = (
        f"Hello! Thank you for reaching out. We have located your order #{order_id}. "
        f"Currently, your order is in status '{status}'. "
    )
    if "damage" in customer_message.lower():
        reply += (
            "We are very sorry to hear that your items arrived damaged. "
            "I have requested a full refund and will process compensation once approved by our founders."
        )
    else:
        reply += "Please let us know if you need anything else."
        
    return {
        "drafted_text": reply,
        "drafted_at": datetime.utcnow()
    }

async def issue_refund(db, order_id: str, amount: float, reason: str) -> Dict[str, Any]:
    order = await OrderService.get_by_id(db, order_id)
    if not order:
        return {"error": f"Order with ID '{order_id}' not found"}
        
    refund_doc = {
        "order_id": order_id,
        "amount": amount,
        "reason": reason,
        "status": "pending_approval",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.refunds.insert_one(refund_doc)
    refund_doc["_id"] = str(result.inserted_id)
    return {
        "success": True,
        "refund_id": refund_doc["_id"],
        "order_id": order_id,
        "amount": amount,
        "status": "pending_approval"
    }

async def send_response(db, customer_email: str, response_text: str) -> Dict[str, Any]:
    # Simulation tool for sending emails
    logger.info(f"SupportAgent: Sending email to {customer_email}: {response_text[:30]}...")
    return {
        "success": True,
        "sent_to": customer_email,
        "timestamp": datetime.utcnow(),
        "preview": response_text
    }

# --- Customer Support Agent Definition ---
class SupportAgent(BaseAgent):
    def __init__(self, db):
        super().__init__("support", db)
        
        # Tool: Get Order Status
        self.register_tool(
            name="get_order_status",
            description="Fetch the status, tracking number, and items of a customer order.",
            input_schema={
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "Unique order identifier"
                    }
                },
                "required": ["order_id"]
            },
            func=get_order_status
        )
        
        # Tool: Draft Response
        self.register_tool(
            name="draft_response",
            description="Draft a response message using order details context.",
            input_schema={
                "type": "object",
                "properties": {
                    "customer_message": {
                        "type": "string",
                        "description": "Raw query string from customer"
                    },
                    "order_context": {
                        "type": "object",
                        "description": "Dictionary of order properties from get_order_status"
                    }
                },
                "required": ["customer_message", "order_context"]
            },
            func=draft_response
        )
        
        # Tool: Issue Refund
        self.register_tool(
            name="issue_refund",
            description="Create a formal refund log for customer compensation.",
            input_schema={
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "Order identifier"
                    },
                    "amount": {
                        "type": "number",
                        "description": "Monetary value to refund (e.g. 50.00)"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Reason for processing refund"
                    }
                },
                "required": ["order_id", "amount", "reason"]
            },
            func=issue_refund
        )

        # Tool: Send Response
        self.register_tool(
            name="send_response",
            description="Send a finalized text response back to the customer's email.",
            input_schema={
                "type": "object",
                "properties": {
                    "customer_email": {
                        "type": "string",
                        "description": "Customer email address"
                    },
                    "response_text": {
                        "type": "string",
                        "description": "Body copy of response"
                    }
                },
                "required": ["customer_email", "response_text"]
            },
            func=send_response
        )
