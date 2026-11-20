"""
MCP Client Service for Coffee Enterprise.
Exposes REST Chat API and orchestrates MCP tool calls to the remote MCP Server.
"""

import json
import logging
import os
from starlette.applications import Starlette
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.routing import Route
from mcp_service.client.chatbot_agent import CoffeeChatbotAgent
from mcp_service.client.mcp_client import CoffeeMCPClient
from mcp_service.security.jwt_auth import verify_and_extract_identity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-client")

# Initialize MCP Client pointing to the MCP Server URL
mcp_server_url = os.getenv("MCP_SERVER_URL", "http://mcp-server:8001")
mcp_client = CoffeeMCPClient(server_url=mcp_server_url)
chatbot_agent = CoffeeChatbotAgent(mcp_client=mcp_client)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


async def chat_handler(request):
    if request.method == "OPTIONS":
        return JSONResponse({}, headers=CORS_HEADERS)

    try:
        # Zero-Trust Identity: Authenticate Bearer JWT token from HTTP Authorization header
        auth_header = request.headers.get("authorization")
        try:
            client_id, user_role, _ = verify_and_extract_identity(auth_header)
        except ValueError as auth_err:
            return JSONResponse(
                {
                    "reply": str(auth_err),
                    "error": "UNAUTHORIZED",
                    "ui_actions": [],
                    "blockedByShield": True,
                    "riskLevel": "SUSPICIOUS",
                    "riskScore": 40,
                },
                status_code=401,
                headers=CORS_HEADERS,
            )

        raw_body = await request.body()
        try:
            decoded = raw_body.decode("utf-8")
        except UnicodeDecodeError:
            decoded = raw_body.decode("latin-1", errors="replace")
        body = json.loads(decoded) if decoded.strip() else {}
        
        # User message and real-time cart state from React
        user_msg = body.get("message", "")
        current_cart = body.get("current_cart", [])

        res = await chatbot_agent.process_message(
            user_message=user_msg,
            client_id=client_id,
            user_role=user_role,
            current_cart=current_cart,
        )

        return JSONResponse(
            {
                "reply": res.reply,
                "tool_results": getattr(res, "tool_results", []),
                "ui_actions": res.ui_actions,
                "toolUsed": res.tool_used,
                "toolData": res.tool_data,
                "riskLevel": (
                    res.risk_level.name
                    if hasattr(res.risk_level, "name")
                    else str(res.risk_level)
                ),
                "riskScore": res.risk_score,
                "blockedByShield": res.blocked_by_shield,
                "auditNotes": res.audit_notes,
            },
            headers=CORS_HEADERS,
        )
    except Exception as exc:
        logger.error(f"Chat error: {exc}", exc_info=True)
        return JSONResponse(
            {
                "reply": f"Disculpa, ocurrió un error interno procesando la consulta: {str(exc)}",
                "error": str(exc),
                "blockedByShield": False,
                "riskLevel": "SAFE",
                "riskScore": 0,
            },
            status_code=500,
            headers=CORS_HEADERS,
        )


async def healthz_handler(request):
    return PlainTextResponse("OK", headers=CORS_HEADERS)


async def tools_handler(request):
    if request.method == "OPTIONS":
        return JSONResponse({}, headers=CORS_HEADERS)
    tools = await mcp_client.list_available_tools()
    return JSONResponse(tools, headers=CORS_HEADERS)


app = Starlette(
    routes=[
        Route("/api/chat", chat_handler, methods=["POST", "OPTIONS"]),
        Route("/healthz", healthz_handler, methods=["GET"]),
        Route("/api/tools", tools_handler, methods=["GET", "OPTIONS"]),
    ]
)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting MCP Client on port {port}, target MCP Server: {mcp_server_url}")
    uvicorn.run(app, host="0.0.0.0", port=port)
