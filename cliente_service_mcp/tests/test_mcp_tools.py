"""
Unit and integration tests for MCP Server tools.
"""

import pytest
from mcp_service.server.tools.stock_tools import (
    check_coffee_stock,
    get_low_stock_alerts,
    get_inventory_health_report,
)
from mcp_service.server.tools.catalog_tools import (
    search_coffee_by_origin,
    filter_coffee_by_roast_and_category,
    get_flavor_profile_recommendations,
)
from mcp_service.server.tools.order_tools import (
    get_order_tracking_status,
    get_customer_order_history,
)
from mcp_service.server.tools.skills_tools import (
    calculate_barista_recipe,
    recommend_coffee_blend,
)


@pytest.mark.asyncio
async def test_check_coffee_stock_found():
    res = await check_coffee_stock("COF-COL-HUI-01")
    assert res["found"] is True
    assert res["sku"] == "COF-COL-HUI-01"
    assert res["stockQuantity"] > 0
    assert res["status"] in ["IN_STOCK", "LOW_STOCK_WARNING"]


@pytest.mark.asyncio
async def test_check_coffee_stock_not_found():
    res = await check_coffee_stock("NON-EXISTENT-SKU")
    assert res["found"] is False
    assert "No se encontró" in res["message"]


@pytest.mark.asyncio
async def test_get_low_stock_alerts():
    res = await get_low_stock_alerts(threshold=10)
    assert "totalAlerts" in res
    assert isinstance(res["items"], list)
    for item in res["items"]:
        assert item["currentStock"] <= 10


@pytest.mark.asyncio
async def test_get_inventory_health_report():
    res = await get_inventory_health_report()
    assert res["totalSkus"] >= 5
    assert res["totalUnitsInStock"] > 0
    assert res["estimatedInventoryValueUsd"] > 0
    assert res["inventoryStatus"] in ["HEALTHY", "ATTENTION_REQUIRED"]


@pytest.mark.asyncio
async def test_search_coffee_by_origin():
    res = await search_coffee_by_origin("Huila")
    assert res["matchCount"] >= 1
    assert any("Huila" in r["origin"] for r in res["results"])

    res_empty = await search_coffee_by_origin("Marte")
    assert res_empty["matchCount"] == 0


@pytest.mark.asyncio
async def test_filter_coffee_by_roast_and_category():
    res = await filter_coffee_by_roast_and_category(category="SPECIALTY", roast_level="LIGHT")
    assert res["count"] >= 1
    for p in res["products"]:
        assert p["category"] == "SPECIALTY"
        assert p["roastLevel"] == "LIGHT"


@pytest.mark.asyncio
async def test_get_flavor_profile_recommendations():
    res = await get_flavor_profile_recommendations(["jazmín", "miel"])
    assert res["recommendationCount"] >= 1
    top = res["recommendations"][0]
    assert "jazmín" in top["matchedNotes"] or "miel" in top["matchedNotes"]


@pytest.mark.asyncio
async def test_get_order_tracking_status():
    res = await get_order_tracking_status("ORD-2026-0001")
    assert res["found"] is True
    assert res["orderNumber"] == "ORD-2026-0001"
    assert res["currentStatus"] == "DELIVERED"
    assert res["progressPercentage"] == 100
    assert "@" in res["customerEmail"]
    # Check that customer email is masked for PII safety
    assert "*" in res["customerEmail"]


@pytest.mark.asyncio
async def test_get_customer_order_history():
    res = await get_customer_order_history("carlos.mendoza@email.com")
    assert res["totalOrdersFound"] >= 1
    assert res["orders"][0]["orderNumber"] == "ORD-2026-0001"


@pytest.mark.asyncio
async def test_calculate_barista_recipe_v60():
    res = await calculate_barista_recipe("V60", roast_level="LIGHT", coffee_grams=18.0)
    assert res["supported"] is True
    assert res["method"] == "V60"
    assert res["brewRatio"] == "1:16.0"
    assert res["waterVolumeMl"] == 288.0
    assert res["waterTemperatureCelsius"] == 94  # 92 base + 2 for light roast
    assert len(res["recommendedSteps"]) > 0


@pytest.mark.asyncio
async def test_calculate_barista_recipe_espresso():
    res = await calculate_barista_recipe("ESPRESSO", roast_level="DARK", coffee_grams=18.0)
    assert res["supported"] is True
    assert res["method"] == "ESPRESSO"
    assert res["waterVolumeMl"] == 36.0  # 18 * 2.0
    assert res["waterTemperatureCelsius"] == 88  # 91 base - 3 for dark roast


@pytest.mark.asyncio
async def test_calculate_barista_recipe_invalid_method():
    res = await calculate_barista_recipe("METODO_INVENTADO")
    assert res["supported"] is False
    assert "no reconocido" in res["message"]


@pytest.mark.asyncio
async def test_recommend_coffee_blend():
    res_milk = await recommend_coffee_blend(intensity_preference="INTENSE", milk_based=True)
    assert "Latte" in res_milk["blendName"] or "Espresso" in res_milk["blendName"]
    assert len(res_milk["components"]) >= 2

    res_delicate = await recommend_coffee_blend(intensity_preference="DELICATE", milk_based=False)
    assert "Floral" in res_delicate["blendName"]
    assert res_delicate["recommendedRoast"] == "LIGHT"


@pytest.mark.asyncio
async def test_mcp_client_tool_enumeration(mcp_client):
    tools = await mcp_client.list_available_tools()
    tool_names = [t["name"] for t in tools]
    assert "check_stock" in tool_names
    assert "get_low_stock" in tool_names
    assert "get_inventory_summary" in tool_names
    assert "track_order" in tool_names
    assert "get_barista_recipe" in tool_names
    assert "get_blend_formulation" in tool_names
