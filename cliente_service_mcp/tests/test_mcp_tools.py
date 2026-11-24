"""
Unit and integration tests for Coffee MCP Client and Backend API Client.
Validates production client resilience, empty catalog handling, and structured extraction.
"""

import pytest
from mcp_service.api_client import BackendApiClient
from mcp_service.client.mcp_client import CoffeeMCPClient
from mcp_service.client.structured_extractor import extract_intent_fallback
from mcp_service.schemas.ui_actions import IntentType


@pytest.fixture
def api_client():
    return BackendApiClient(base_url="http://127.0.0.1:59999")


@pytest.fixture
def mcp_client():
    return CoffeeMCPClient(server_url="http://127.0.0.1:59998")


@pytest.mark.asyncio
async def test_backend_client_empty_catalog_resilience(api_client):
    """Catalog fetch returns empty list without crashing when backend is clean/unreachable."""
    products = await api_client.get_all_products()
    assert isinstance(products, list)
    assert len(products) == 0


@pytest.mark.asyncio
async def test_backend_client_sku_not_found(api_client):
    """Product SKU lookup returns None when not found."""
    prod = await api_client.get_product_by_sku("NON-EXISTENT-SKU")
    assert prod is None


@pytest.mark.asyncio
async def test_backend_client_order_not_found(api_client):
    """Order lookup returns None when order does not exist."""
    order = await api_client.get_order_by_number("ORD-UNKNOWN-9999")
    assert order is None


@pytest.mark.asyncio
async def test_backend_client_orders_by_email_empty(api_client):
    """Customer order history returns empty list when customer has no orders."""
    orders = await api_client.get_orders_by_customer_email("nonexistent@example.com")
    assert isinstance(orders, list)
    assert len(orders) == 0


@pytest.mark.asyncio
async def test_mcp_client_graceful_remote_call_failure(mcp_client):
    """Remote tool execution returns structured error dictionary rather than uncaught exception."""
    res = await mcp_client.call_tool("consultar_stock", {"sku": "PRD-01"})
    assert "is_error" in res
    assert res["is_error"] is True


def test_structured_extractor_create_product():
    """Structured extractor detects cafeteria product creation with real category and units."""
    result = extract_intent_fallback("crea un cafe con chocolate a 2.50 dolares", user_role="ROLE_ADMIN")
    assert result.intent == IntentType.CREAR_PRODUCTO
    assert result.parameters.precio == 2.50
    assert result.parameters.categoria == "BEBIDAS_CALIENTES"
    assert result.parameters.stockInicial == 50
    assert result.requires_admin is True


def test_structured_extractor_catalog_reset():
    """Structured extractor detects catalog purge and flags destructive action."""
    result = extract_intent_fallback("elimina todos los cafés del catálogo", user_role="ROLE_ADMIN")
    assert result.intent == IntentType.RESETEO_CATALOGO
    assert result.is_destructive is True
    assert result.requires_admin is True


def test_structured_extractor_confirm_action():
    """Structured extractor recognizes two-step confirmation phrase."""
    result = extract_intent_fallback("proceder con el reseteo", user_role="ROLE_ADMIN")
    assert result.intent == IntentType.CONFIRMAR_ACCION
    assert result.is_destructive is True


def test_structured_extractor_add_to_cart():
    """Structured extractor recognizes add to cart intent."""
    result = extract_intent_fallback("añade al carrito un café americano", user_role="ROLE_CUSTOMER")
    assert result.intent == IntentType.ADD_TO_CART
    assert result.requires_admin is False


def test_structured_extractor_search():
    """Structured extractor extracts search query parameter."""
    result = extract_intent_fallback("busca cafés con notas a chocolate", user_role="ROLE_CUSTOMER")
    assert result.intent == IntentType.BUSCAR_PRODUCTO
    assert "chocolate" in result.parameters.query.lower()
