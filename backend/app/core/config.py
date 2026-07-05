from typing import List, Optional
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Varek.in Backend"
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 52560000  # 100 Years (No Expiry)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 36500       # 100 Years
    
    MONGO_URI: str
    REDIS_URL: Optional[str] = None

    # LLM Provider Configuration
    LLM_PROVIDER: str = "anthropic"  # Options: anthropic, gemini, openai, groq
    LLM_MODEL: Optional[str] = None  # Custom model override
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
