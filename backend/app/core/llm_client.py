import os
import json
import logging
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMResponse:
    def __init__(self, text: str, tool_calls: List[Dict[str, Any]], input_tokens: int, output_tokens: int, cost: float):
        self.text = text
        self.tool_calls = tool_calls  # List of {"id": str, "name": str, "input": dict}
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.cost = cost

class LLMClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLM_MODEL
        
        # Configure client variables based on provider
        if self.provider == "anthropic":
            from anthropic import AsyncAnthropic
            api_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", settings.JWT_SECRET)
            self.client = AsyncAnthropic(api_key=api_key)
            if not self.model:
                self.model = "claude-3-5-sonnet-20240620"
                
        elif self.provider == "openai":
            from openai import AsyncOpenAI
            api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
            self.client = AsyncOpenAI(api_key=api_key)
            if not self.model:
                self.model = "gpt-4o"
                
        elif self.provider == "groq":
            from openai import AsyncOpenAI
            api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
            # Groq uses the OpenAI SDK targeting their base URL
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            if not self.model:
                self.model = "llama-3.1-70b-versatile"
                
        elif self.provider == "gemini":
            import google.generativeai as genai
            api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            genai.configure(api_key=api_key)
            if not self.model:
                self.model = "gemini-1.5-flash"
            self.client = genai
        else:
            logger.warning(f"Unknown LLM provider '{self.provider}'. Falling back to Anthropic.")
            from anthropic import AsyncAnthropic
            api_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", settings.JWT_SECRET)
            self.client = AsyncAnthropic(api_key=api_key)
            self.provider = "anthropic"
            self.model = "claude-3-5-sonnet-20240620"

    def _estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        # Default rates (per million tokens)
        rates = {
            "anthropic": {"input": 3.0, "output": 15.0},      # Claude 3.5 Sonnet
            "openai": {"input": 5.0, "output": 15.0},         # GPT-4o
            "groq": {"input": 0.59, "output": 0.79},          # Llama 3.1 70B
            "gemini": {"input": 0.075, "output": 0.30}        # Gemini 1.5 Flash
        }
        provider_rates = rates.get(self.provider, {"input": 3.0, "output": 15.0})
        return (input_tokens * provider_rates["input"] + output_tokens * provider_rates["output"]) / 1_000_000.0

    async def generate(self, messages: List[Dict[str, Any]], system_prompt: str, tools: List[Dict[str, Any]] = None) -> LLMResponse:
        """
        Send a completion request to the chosen LLM provider.
        
        Args:
            messages: List of messages in Anthropic-like format:
                      [{"role": "user"|"assistant", "content": str|list}]
                      NOTE: Any tool results are passed in Anthropic format.
            system_prompt: System instructions.
            tools: Anthropic-style tool definition list:
                   [{"name": str, "description": str, "input_schema": dict}]
        """
        if self.provider == "anthropic":
            return await self._generate_anthropic(messages, system_prompt, tools)
        elif self.provider in ("openai", "groq"):
            return await self._generate_openai_compatible(messages, system_prompt, tools)
        elif self.provider == "gemini":
            return await self._generate_gemini(messages, system_prompt, tools)

    async def _generate_anthropic(self, messages: List[Dict[str, Any]], system_prompt: str, tools: List[Dict[str, Any]]) -> LLMResponse:
        # Anthropic schema is native here
        anthropic_tools = []
        if tools:
            for t in tools:
                anthropic_tools.append({
                    "name": t["name"],
                    "description": t["description"],
                    "input_schema": t["input_schema"]
                })

        # Make sure messages match expected type structure for Anthropic
        cleaned_messages = []
        for msg in messages:
            cleaned_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            system=system_prompt,
            messages=cleaned_messages,
            tools=anthropic_tools if anthropic_tools else None
        )

        text = ""
        tool_calls = []
        for block in response.content:
            if block.type == "text":
                text += block.text
            elif block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "name": block.name,
                    "input": block.input
                })

        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        cost = self._estimate_cost(input_tokens, output_tokens)

        return LLMResponse(text, tool_calls, input_tokens, output_tokens, cost)

    async def _generate_openai_compatible(self, messages: List[Dict[str, Any]], system_prompt: str, tools: List[Dict[str, Any]]) -> LLMResponse:
        # Build openai messages
        openai_messages = []
        if system_prompt:
            openai_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if isinstance(content, list):
                # Anthropic tool results or multiple blocks
                for item in content:
                    if isinstance(item, dict):
                        if item.get("type") == "tool_result":
                            openai_messages.append({
                                "role": "tool",
                                "tool_call_id": item.get("tool_use_id"),
                                "content": str(item.get("content"))
                            })
                        elif item.get("type") == "text":
                            openai_messages.append({"role": role, "content": item.get("text")})
            elif isinstance(content, str):
                openai_messages.append({"role": role, "content": content})

        # Format tools for OpenAI
        openai_tools = None
        if tools:
            openai_tools = []
            for t in tools:
                openai_tools.append({
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["input_schema"]
                    }
                })

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=openai_messages,
            tools=openai_tools if openai_tools else None,
            max_tokens=1500
        )

        choice = response.choices[0]
        text = choice.message.content or ""
        
        tool_calls = []
        if choice.message.tool_calls:
            for tc in choice.message.tool_calls:
                try:
                    tool_input = json.loads(tc.function.arguments)
                except Exception:
                    tool_input = tc.function.arguments
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "input": tool_input
                })

        # OpenAI usage tokens
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = self._estimate_cost(input_tokens, output_tokens)

        return LLMResponse(text, tool_calls, input_tokens, output_tokens, cost)

    async def _generate_gemini(self, messages: List[Dict[str, Any]], system_prompt: str, tools: List[Dict[str, Any]]) -> LLMResponse:
        # Convert tools to Gemini tools format
        gemini_tools = None
        if tools:
            declarations = []
            for t in tools:
                # We need to map 'type' values to uppercase for Gemini parameter schema
                parameters = t["input_schema"].copy()
                if "type" in parameters:
                    parameters["type"] = parameters["type"].upper()
                if "properties" in parameters:
                    for prop_name, prop_val in parameters["properties"].items():
                        if "type" in prop_val:
                            prop_val["type"] = prop_val["type"].upper()
                
                declarations.append({
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": parameters
                })
            gemini_tools = [{"function_declarations": declarations}]

        # Prepare Chat contents
        gemini_contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            content = msg["content"]
            
            parts = []
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict):
                        if item.get("type") == "tool_result":
                            # Translate tool result block
                            parts.append({
                                "function_response": {
                                    "name": item.get("tool_use_id"), # In this client we fallback tool ID to name
                                    "response": {"output": item.get("content")}
                                }
                            })
                        elif item.get("type") == "text":
                            parts.append({"text": item.get("text")})
            else:
                parts.append({"text": content})
                
            gemini_contents.append({
                "role": role,
                "parts": parts
            })

        # Instantiate dynamic model
        model = self.client.GenerativeModel(
            model_name=self.model,
            system_instruction=system_prompt,
            tools=gemini_tools
        )

        # Generate content
        # Note: google-generativeai SDK synchronous / asynchronous wrapper
        loop = os.environ.get("ASYNC_LOOP") # just running it in executor if needed, but SDK supports async generate_content_async
        response = await model.generate_content_async(
            contents=gemini_contents,
            generation_config={"max_output_tokens": 1500}
        )

        text = response.text or ""
        tool_calls = []
        
        # Extract function calls if any
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.function_call:
                    fc = part.function_call
                    # Extract arguments
                    args = {}
                    for key, val in fc.args.items():
                        args[key] = val
                    tool_calls.append({
                        "id": fc.name, # Gemini doesn't use unique IDs in same way, fallback to name
                        "name": fc.name,
                        "input": args
                    })

        # Token usage estimation (Gemini provides prompt_token_count and candidates_token_count)
        # Note: If usage metadata is missing, estimate roughly or set to 0.
        input_tokens = getattr(response.usage_metadata, "prompt_token_count", 0)
        output_tokens = getattr(response.usage_metadata, "candidates_token_count", 0)
        cost = self._estimate_cost(input_tokens, output_tokens)

        return LLMResponse(text, tool_calls, input_tokens, output_tokens, cost)
