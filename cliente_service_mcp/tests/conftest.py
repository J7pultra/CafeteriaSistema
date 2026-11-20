"""
Pytest configuration and shared fixtures for MCP tests.
"""

import os
import sys
import pytest

# Ensure mcp_service root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from mcp_service.client.mcp_client import CoffeeMCPClient
from mcp_service.client.chatbot_agent import CoffeeChatbotAgent
from mcp_service.security.rate_limiter import rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Reset rate limiter state before each test."""
    rate_limiter.reset()
    yield
    rate_limiter.reset()


@pytest.fixture
def mcp_client():
    return CoffeeMCPClient()


@pytest.fixture
def chatbot():
    return CoffeeChatbotAgent()
