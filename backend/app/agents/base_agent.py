import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
import os
import yaml
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.models.task import TaskInDB, TaskStatus, StatusHistoryItem
from app.models.agent_log import AgentLogCreate, LogStatus
from app.services.agent_logs import AgentLogService

logger = logging.getLogger(__name__)

class BaseAgent:
    def __init__(self, agent_name: str, db):
        self.agent_name = agent_name
        self.db = db
        self.tools = {}
        self.client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", settings.JWT_SECRET))
        
        # Load agent config from core/agents.yaml
        self.config = {}
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core", "agents.yaml")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    full_config = yaml.safe_load(f)
                    self.config = full_config.get("agents", {}).get(agent_name, {})
            except Exception as e:
                logger.error(f"BaseAgent: Failed to load configuration for {agent_name}: {e}")
                
        self.system_prompt = self.config.get("system_prompt", f"You are the {agent_name} agent.")
        self.approval_rules = self.config.get("approval_rules", {})

    def register_tool(self, name: str, description: str, input_schema: dict, func: callable):
        """
        Register a local Python function to act as an agent tool.
        """
        self.tools[name] = {
            "definition": {
                "name": name,
                "description": description,
                "input_schema": input_schema
            },
            "callable": func
        }

    async def remember(self, task_id: str, memory_type: str, content: Dict[str, Any]):
        """
        Store a persistent memory snippet in MongoDB.
        """
        memory_doc = {
            "agent_name": self.agent_name,
            "task_id": task_id,
            "memory_type": memory_type,
            "content": content,
            "created_at": datetime.utcnow()
        }
        await self.db.agent_memory.insert_one(memory_doc)
        logger.debug(f"BaseAgent ({self.agent_name}): Remembered {memory_type}")

    async def recall(self, query_filter: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Recall historical memory records matching criteria.
        """
        query = {"agent_name": self.agent_name}
        query.update(query_filter)
        cursor = self.db.agent_memory.find(query).sort("created_at", -1).limit(limit)
        memories = []
        async for doc in cursor:
            # Convert ObjectId to string for compatibility
            doc["_id"] = str(doc["_id"])
            memories.append(doc)
        return memories

    async def check_approval_required(self, tool_name: str, tool_args: Dict[str, Any]) -> bool:
        """
        Validates if a tool invocation requires manual approval.
        """
        rule = self.approval_rules.get(tool_name)
        if not rule:
            return False
            
        # Rules: Inventory check request threshold
        if tool_name == "create_restock_request":
            qty = tool_args.get("quantity", 0)
            max_qty = rule.get("max_quantity_auto_approve", 100)
            if qty > max_qty:
                return True
                
        # Rules: Inventory update stock threshold
        elif tool_name == "update_stock":
            delta = tool_args.get("quantity_delta", 0)
            if delta < 0: # Check only write-offs / reductions
                max_negative = rule.get("max_negative_delta_auto_approve", 20)
                if abs(delta) > max_negative:
                    return True
                    
        # Rules: Support refunds threshold
        elif tool_name == "issue_refund":
            amount = tool_args.get("amount", 0.0)
            max_amount = rule.get("max_amount_auto_approve", 50.00)
            if amount > max_amount:
                return True
                
        # Rules: Support responses content check
        elif tool_name == "send_response":
            message = tool_args.get("response_text", "").lower()
            keywords = rule.get("require_approval_if_contains", [])
            if any(kw in message for kw in keywords):
                return True
                
        return False

    def _estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        # Claude 3.5 Sonnet Pricing: $3/Million Input, $15/Million Output
        return (input_tokens * 3.0 + output_tokens * 15.0) / 1_000_000.0

    async def execute_tool(self, task_id: str, tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a registered tool and logs input/output results.
        """
        tool = self.tools.get(tool_name)
        if not tool:
            return {"error": f"Tool '{tool_name}' is not registered on agent '{self.agent_name}'"}
            
        logger.info(f"BaseAgent ({self.agent_name}): Executing tool '{tool_name}' with args {tool_args}")
        
        # Log tool execution start
        await AgentLogService.create(self.db, AgentLogCreate(
            agent_name=self.agent_name,
            action=f"tool_exec_{tool_name}",
            input=tool_args,
            output={"status": "executing"},
            status=LogStatus.SUCCESS,
            related_task_id=task_id
        ))
        
        try:
            result = await tool["callable"](self.db, **tool_args)
            
            # Log tool execution success
            await AgentLogService.create(self.db, AgentLogCreate(
                agent_name=self.agent_name,
                action=f"tool_exec_{tool_name}",
                input=tool_args,
                output=result,
                status=LogStatus.SUCCESS,
                related_task_id=task_id
            ))
            return result
        except Exception as e:
            error_msg = str(e)
            logger.error(f"BaseAgent ({self.agent_name}): Tool execution error: {error_msg}")
            await AgentLogService.create(self.db, AgentLogCreate(
                agent_name=self.agent_name,
                action=f"tool_exec_{tool_name}",
                input=tool_args,
                output={"error": error_msg},
                status=LogStatus.FAILED,
                related_task_id=task_id
            ))
            return {"error": error_msg}

    async def think(self, task: TaskInDB, tool_override_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Main reasoning cycle. Resolves Claude inputs, executes tool cycles,
        gated execution blocks, and returns final summaries.
        """
        logger.info(f"BaseAgent ({self.agent_name}): Thinking about task '{task.title}'")
        
        # 1. Memory Context Retrieval
        # Recall previous observations relating to task properties
        recall_keywords = []
        payload_keys = ["sku", "order_id", "product_id"]
        for k in payload_keys:
            val = task.payload.get(k)
            if val:
                recall_keywords.append({f"content.{k}": val})
                
        memory_str = "No past memories found."
        if recall_keywords:
            memories = await self.recall({"$or": recall_keywords}, limit=5)
            if memories:
                memory_str = "\n".join(
                    f"- At {m['created_at'].isoformat()}: type={m['memory_type']}, content={m['content']}"
                    for m in memories
                )
                
        # 2. Setup message blocks
        messages = [
            {
                "role": "user",
                "content": f"Task: {task.title}\nDescription: {task.description}\nPayload: {task.payload}\n\nRelevant Memory Context:\n{memory_str}"
            }
        ]
        
        # If we have an approved execution result injected back into the thinker
        if tool_override_result:
            messages.append({
                "role": "assistant",
                "content": "I previously initiated a tool call that required manual approval. The approval has been granted and the execution result is available below."
            })
            messages.append({
                "role": "user",
                "content": f"Manual Approval Tool Call Result: {tool_override_result}"
            })
            
        # Format registered tool models for Anthropic
        anthropic_tools = [t["definition"] for t in self.tools.values()]
        
        # 3. Call Anthropic
        try:
            # Fallback if no Anthropic key is set to simulate agent thinking
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                logger.warning("BaseAgent: ANTHROPIC_API_KEY not set. Operating in Simulation/Mock Mode.")
                return await self._simulate_mock_think(task, tool_override_result)
                
            response = await self.client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=1500,
                system=self.system_prompt,
                messages=messages,
                tools=anthropic_tools if anthropic_tools else None
            )
            
            # Estimate and log usage cost
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            estimated_cost = self._estimate_cost(input_tokens, output_tokens)
            
            await AgentLogService.create(self.db, AgentLogCreate(
                agent_name=self.agent_name,
                action="llm_thinking",
                input={"messages_summary": str(messages)},
                output={
                    "text": response.content[0].text if response.content and hasattr(response.content[0], "text") else "",
                    "tool_calls": [block.model_dump() for block in response.content if block.type == "tool_use"],
                    "token_usage": {"input": input_tokens, "output": output_tokens},
                    "cost_estimate": estimated_cost
                },
                status=LogStatus.SUCCESS,
                cost=estimated_cost,
                related_task_id=task.task_id
            ))
            
            # Analyze responses
            tool_calls = [block for block in response.content if block.type == "tool_use"]
            if tool_calls:
                selected_tool = tool_calls[0]
                tool_name = selected_tool.name
                tool_args = selected_tool.input
                
                # Check Approval required
                requires_approval = await self.check_approval_required(tool_name, tool_args)
                if requires_approval:
                    logger.info(f"BaseAgent ({self.agent_name}): Tool '{tool_name}' requires approval! Pausing execution.")
                    return {
                        "action": "pause_for_approval",
                        "pending_tool_call": {
                            "tool_name": tool_name,
                            "arguments": tool_args
                        }
                    }
                    
                # Execute tool directly
                tool_result = await self.execute_tool(task.task_id, tool_name, tool_args)
                
                # Feed result back to Claude to formulate final response
                messages.append({
                    "role": "assistant",
                    "content": response.content
                })
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": selected_tool.id,
                            "content": str(tool_result)
                        }
                    ]
                })
                
                # Recall Claude
                follow_up = await self.client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=1000,
                    system=self.system_prompt,
                    messages=messages
                )
                
                final_text = follow_up.content[0].text
                # Log final thinking step
                await AgentLogService.create(self.db, AgentLogCreate(
                    agent_name=self.agent_name,
                    action="llm_final_response",
                    input={"tool_result": str(tool_result)},
                    output={"text": final_text},
                    status=LogStatus.SUCCESS,
                    cost=self._estimate_cost(follow_up.usage.input_tokens, follow_up.usage.output_tokens),
                    related_task_id=task.task_id
                ))
                return {"action": "complete", "result": {"output": final_text}}
                
            else:
                # Text response completion
                final_text = response.content[0].text if response.content else "No reply generated."
                return {"action": "complete", "result": {"output": final_text}}
                
        except Exception as e:
            logger.exception(f"BaseAgent: Anthropic API call error: {e}")
            raise e

    async def _simulate_mock_think(self, task: TaskInDB, tool_override_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Simulation helper for tests or runs without active API keys.
        Parses keywords to decide stock checks or refund executions.
        """
        desc = task.description.lower()
        title = task.title.lower()
        
        # 1. Approved Override Result flow
        if tool_override_result:
            return {
                "action": "complete",
                "result": {
                    "output": f"Simulation completion. Tool run outcome: {tool_override_result}"
                }
            }
            
        # 2. Inventory check Stock adjustment requests
        if self.agent_name == "inventory":
            sku = task.payload.get("sku", "SH-LN-MIN-001")
            
            # Decide if large update
            if "restock" in desc or "restock" in title:
                qty = task.payload.get("quantity", 150)
                if qty > 100:
                    # Require approval
                    return {
                        "action": "pause_for_approval",
                        "pending_tool_call": {
                            "tool_name": "create_restock_request",
                            "arguments": {"sku": sku, "quantity": qty, "supplier_note": "Automated simulated low stock restock"}
                        }
                    }
                else:
                    # Small restock auto execution
                    result = await self.execute_tool(task.task_id, "update_stock", {"sku": sku, "quantity_delta": qty, "reason": "Low stock auto-replenish"})
                    return {"action": "complete", "result": {"output": f"Auto-restocked small delta {qty} for SKU {sku}. Output: {result}"}}
            
            # Default stock check
            result = await self.execute_tool(task.task_id, "check_stock_level", {"sku": sku})
            return {"action": "complete", "result": {"output": f"Simulated stock check output: {result}"}}
            
        # 3. Support response drafting & refunds
        elif self.agent_name == "support":
            order_id = task.payload.get("order_id", "789")
            
            if "refund" in desc or "refund" in title:
                amount = task.payload.get("amount", 60.0)
                if amount > 50.0:
                    return {
                        "action": "pause_for_approval",
                        "pending_tool_call": {
                            "tool_name": "issue_refund",
                            "arguments": {"order_id": order_id, "amount": amount, "reason": "Item arrived damaged"}
                        }
                    }
                else:
                    result = await self.execute_tool(task.task_id, "issue_refund", {"order_id": order_id, "amount": amount, "reason": "Simulated low refund"})
                    return {"action": "complete", "result": {"output": f"Simulated small refund issued for order {order_id}. Output: {result}"}}
            
            # Default order status
            result = await self.execute_tool(task.task_id, "get_order_status", {"order_id": order_id})
            draft = await self.execute_tool(task.task_id, "draft_response", {"customer_message": task.description, "order_context": result})
            return {"action": "complete", "result": {"output": f"Simulated reply: {draft['drafted_text']}"}}
            
        return {"action": "complete", "result": {"output": "Simulated agent thinking complete."}}
