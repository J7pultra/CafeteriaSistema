"""
Configuration settings for Coffee Enterprise MCP Service.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # Server identity
    SERVER_NAME: str = os.getenv("MCP_SERVER_NAME", "CoffeeEnterpriseMCP")
    SERVER_VERSION: str = "1.0.0"

    # Backend Connection
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:8080")
    API_TIMEOUT_SECONDS: float = float(os.getenv("API_TIMEOUT_SECONDS", "10.0"))
    AUTH_TOKEN: str = os.getenv("MCP_AUTH_TOKEN", "")

    # Fallback to local catalog if backend is not reachable
    ENABLE_MOCK_FALLBACK: bool = os.getenv("ENABLE_MOCK_FALLBACK", "true").lower() in ("true", "1", "yes")

    # Security Guardrails
    MAX_PROMPT_LENGTH: int = int(os.getenv("MAX_PROMPT_LENGTH", "4000"))
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_RPM", "60"))
    SHIELD_STRICT_MODE: bool = os.getenv("SHIELD_STRICT_MODE", "true").lower() in ("true", "1", "yes")

    # Transport settings
    SSE_HOST: str = os.getenv("MCP_SSE_HOST", "0.0.0.0")
    SSE_PORT: int = int(os.getenv("MCP_SSE_PORT", "8000"))

    # Gemini AI Integration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")


settings = Settings()
