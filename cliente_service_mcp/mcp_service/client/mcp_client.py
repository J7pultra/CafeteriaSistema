"""
Asynchronous MCP Client for Coffee Enterprise System.
Interacts with the MCPServer either via remote HTTP/SSE or in-process.
"""

import os
from typing import Any, Dict, List, Optional
import httpx
from mcp.server.mcpserver import MCPServer


class CoffeeMCPClient:
    """Client for invoking tools and querying capabilities on the Coffee MCPServer."""

    def __init__(
        self,
        target_server: Optional[MCPServer] = None,
        server_url: Optional[str] = None,
    ):
        self.server = target_server
        self.server_url = (server_url or os.getenv("MCP_SERVER_URL", "")).rstrip("/")

    async def list_available_tools(self) -> List[Dict[str, Any]]:
        """List all tools registered in the MCP server with schemas."""
        if self.server_url:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(f"{self.server_url}/api/tools/list")
                    if resp.status_code == 200:
                        return resp.json()
            except Exception:
                pass

        if not self.server:
            return []

        tools = await self.server.list_tools()
        result = []
        for t in tools:
            schema = getattr(t, "input_schema", getattr(t, "inputSchema", {}))
            result.append({
                "name": t.name,
                "description": t.description,
                "inputSchema": schema,
            })
        return result

    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an MCP tool by name with arguments.

        Returns:
            Dictionary containing 'is_error', 'structured_content', and 'text'.
        """
        # If external server_url is configured, dispatch HTTP tool execution
        if self.server_url:
            try:
                timeout_val = float(os.getenv("MCP_TIMEOUT_SECONDS", "2.0"))
                async with httpx.AsyncClient(timeout=timeout_val) as client:
                    resp = await client.post(
                        f"{self.server_url}/api/tools/call",
                        json={"name": name, "arguments": arguments},
                    )
                    if resp.status_code == 200:
                        return resp.json()
            except Exception as e:
                # Fallback to local execution if network fails
                pass

        if not self.server:
            return {
                "is_error": True,
                "structured_content": None,
                "text": f"Error executing tool '{name}': MCP server is unreachable or offline at {self.server_url}",
            }

        try:
            res = await self.server.call_tool(name, arguments)
            text_output = ""
            if res.content:
                text_output = "\n".join(
                    c.text for c in res.content if hasattr(c, "text") and c.text
                )

            return {
                "is_error": res.is_error,
                "structured_content": res.structured_content,
                "text": text_output,
            }
        except Exception as e:
            return {
                "is_error": True,
                "structured_content": None,
                "text": f"Error executing tool '{name}': {str(e)}",
            }
