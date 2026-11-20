"""
Enterprise Coffee Chatbot Agent for Sistema Café.
Orchestrates 100% AI conversational loop via Gemini Native Function Calling,
Enterprise Guardrails (Prompt Shield, Rate Limiting), DLP Sanitization, and Redis Context.
"""

from dataclasses import dataclass, field
import logging
from typing import Any, Dict, List, Optional
from mcp_service.api_client import backend_client
from mcp_service.client.mcp_client import CoffeeMCPClient
from mcp_service.client.gemini_service import execute_gemini_agent_loop, call_gemini
from mcp_service.memory.redis_memory import conversation_memory
from mcp_service.memory.pending_action_store import pending_action_store
from mcp_service.security.data_sanitizer import data_sanitizer
from mcp_service.security.prompt_shield import prompt_shield, RiskLevel
from mcp_service.security.rate_limiter import rate_limiter

logger = logging.getLogger("mcp-chatbot-agent")


@dataclass
class ChatbotResponse:
    reply: str
    tool_results: List[Dict[str, Any]] = field(default_factory=list)
    ui_actions: List[Dict[str, Any]] = field(default_factory=list)
    tool_used: Optional[str] = None
    tool_data: Optional[Dict[str, Any]] = None
    risk_level: RiskLevel = RiskLevel.SAFE
    risk_score: int = 0
    blocked_by_shield: bool = False
    audit_notes: List[str] = field(default_factory=list)


class CoffeeChatbotAgent:
    """
    Intelligent Barista & Coffee Management Copilot.
    100% AI driven via Google Gemini Function Calling, eliminating all static template responses.
    """

    def __init__(self, mcp_client: Optional[CoffeeMCPClient] = None):
        self.client = mcp_client or CoffeeMCPClient()

    async def process_message(
        self,
        user_message: str,
        client_id: str = "default_user",
        user_role: Optional[str] = None,
        current_cart: Optional[List[Dict[str, Any]]] = None,
    ) -> ChatbotResponse:
        """
        Process a user conversation turn safely through security layers and Gemini's agentic loop.
        """
        audit_notes: List[str] = []

        # 1. Rate Limiter Check (Security Guardrail)
        if not rate_limiter.is_allowed(client_id):
            return ChatbotResponse(
                reply="Has alcanzado el límite de consultas permitidas por minuto. Por favor, aguarda un momento antes de enviar otro mensaje.",
                risk_level=RiskLevel.SUSPICIOUS,
                risk_score=30,
                blocked_by_shield=True,
                audit_notes=["Rate limit threshold reached for client_id: " + client_id],
            )

        # 2. Prompt Injection & Jailbreak Defense Shield
        decision = prompt_shield.analyze(user_message)
        if not decision.allowed:
            return ChatbotResponse(
                reply=decision.refusal_message,
                risk_level=decision.risk_level,
                risk_score=decision.risk_score,
                blocked_by_shield=True,
                audit_notes=decision.reasons,
            )

        clean_input = decision.sanitized_input
        audit_notes.extend(decision.reasons)

        # 3. Retrieve conversation history from Redis
        history = conversation_memory.get_history(client_id, max_messages=10)

        # 4. Native Agentic Loop: 100% AI with Gemini Function Calling & Live Database Context
        try:
            reply, tool_results, ui_actions, tool_used, tool_data = await execute_gemini_agent_loop(
                user_prompt=clean_input,
                user_role=user_role,
                client_id=client_id,
                conversation_history=history,
                current_cart=current_cart,
                mcp_client=self.client,
                pending_action_store=pending_action_store,
                backend_client=backend_client,
            )
        except Exception as loop_err:
            logger.error(f"Error executing Gemini agentic loop: {loop_err}", exc_info=True)
            audit_notes.append(f"Gemini agent loop exception: {str(loop_err)}")
            # Fallback to single-turn conversational call to avoid hardcoded replies
            reply = call_gemini(
                user_prompt=clean_input,
                user_role=user_role,
                conversation_history=history,
                current_cart=current_cart,
            ) or "Disculpa, en este momento el servicio de inteligencia artificial está procesando una alta demanda. ¿Podrías reiterar tu consulta?"
            tool_results = []
            ui_actions = []
            tool_used = None
            tool_data = None

        # 5. Sanitize reply through DLP
        sanitized_reply = data_sanitizer.sanitize_text(reply)
        sanitized_tool_data = data_sanitizer.sanitize_dict(tool_data) if tool_data else None

        # 6. Persist turn in Redis conversation memory
        conversation_memory.add_turn(client_id, clean_input, sanitized_reply)

        return ChatbotResponse(
            reply=sanitized_reply,
            tool_results=tool_results,
            ui_actions=ui_actions,
            tool_used=tool_used,
            tool_data=sanitized_tool_data,
            risk_level=decision.risk_level,
            risk_score=decision.risk_score,
            blocked_by_shield=False,
            audit_notes=audit_notes,
        )


chatbot_agent = CoffeeChatbotAgent()

