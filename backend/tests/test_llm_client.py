import pytest
from unittest.mock import AsyncMock, patch
from app.core.llm_client import LLMClient, LLMResponse
from app.core.config import settings

def test_llm_client_initialization_defaults():
    with patch("app.core.config.settings.LLM_PROVIDER", "anthropic"):
        client = LLMClient()
        assert client.provider == "anthropic"
        assert client.model == "claude-3-5-sonnet-20240620"

def test_llm_client_initialization_custom():
    with patch("app.core.config.settings.LLM_PROVIDER", "openai"):
        with patch("app.core.config.settings.LLM_MODEL", "gpt-4-turbo"):
            client = LLMClient()
            assert client.provider == "openai"
            assert client.model == "gpt-4-turbo"

def test_cost_estimation():
    with patch("app.core.config.settings.LLM_PROVIDER", "openai"):
        client = LLMClient()
        cost = client._estimate_cost(1000, 2000)
        # OpenAI prompt: $5/M, completion: $15/M -> 1000*5/1M + 2000*15/1M = 0.005 + 0.030 = 0.035
        assert abs(cost - 0.035) < 1e-6

@pytest.mark.asyncio
async def test_generate_openai_compatible_format():
    # Verify OpenAI format generation translates correctly
    with patch("app.core.config.settings.LLM_PROVIDER", "openai"):
        client = LLMClient()
        client.client = AsyncMock()
        
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "Response from GPT"
        mock_response.choices[0].message.tool_calls = None
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        
        client.client.chat.completions.create.return_value = mock_response
        
        res = await client.generate(
            messages=[{"role": "user", "content": "Hello"}],
            system_prompt="You are helpful"
        )
        
        assert res.text == "Response from GPT"
        assert res.input_tokens == 100
        assert res.output_tokens == 50
        assert len(res.tool_calls) == 0
        client.client.chat.completions.create.assert_called_once()
