"""
Pydantic Schemas for Real-Time UI Co-Navigation and Intent Classification.
Supports:
- UI Action Types: NAVIGATE, TYPE_AND_SEARCH, HIGHLIGHT_ELEMENT, ADD_TO_CART_VISUAL
- Structured Intent Classification with Gemini Flash
- Chat Request and Response payloads
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UIActionType(str, Enum):
    NAVIGATE = "NAVIGATE"
    TYPE_AND_SEARCH = "TYPE_AND_SEARCH"
    HIGHLIGHT_ELEMENT = "HIGHLIGHT_ELEMENT"
    ADD_TO_CART_VISUAL = "ADD_TO_CART_VISUAL"
    OPEN_CART_DRAWER = "OPEN_CART_DRAWER"
    CLOSE_CART_DRAWER = "CLOSE_CART_DRAWER"


class UIAction(BaseModel):
    type: UIActionType
    route: Optional[str] = None
    targetId: Optional[str] = None
    text: Optional[str] = None
    animation: Optional[str] = "pulse-glow"
    badgeText: Optional[str] = None
    scrollIntoView: Optional[bool] = True
    durationMs: Optional[int] = 4500
    delayMs: Optional[int] = 200
    product: Optional[Dict[str, Any]] = None


class IntentType(str, Enum):
    CREAR_PRODUCTO = "CREAR_PRODUCTO"
    ACTUALIZAR_PRECIO = "ACTUALIZAR_PRECIO"
    DESACTIVAR_PRODUCTO = "DESACTIVAR_PRODUCTO"
    ADD_TO_CART = "ADD_TO_CART"
    CONSULTAR_STOCK = "CONSULTAR_STOCK"
    LISTAR_PRODUCTOS = "LISTAR_PRODUCTOS"
    BUSCAR_PRODUCTO = "BUSCAR_PRODUCTO"
    RECOMENDAR_CAFE = "RECOMENDAR_CAFE"
    RECETA_BARISTA = "RECETA_BARISTA"
    RASTREAR_PEDIDO = "RASTREAR_PEDIDO"
    RESETEO_CATALOGO = "RESETEO_CATALOGO"
    CONFIRMAR_ACCION = "CONFIRMAR_ACCION"
    CONVERSACION_GENERAL = "CONVERSACION_GENERAL"


class IntentParameters(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    tueste: Optional[str] = None
    origen: Optional[str] = None
    categoria: Optional[str] = None
    stockInicial: Optional[int] = None
    notasCata: Optional[str] = None
    sku: Optional[str] = None
    query: Optional[str] = None
    notasDeseadas: Optional[str] = None
    numeroOrden: Optional[str] = None
    metodo: Optional[str] = None
    gramos: Optional[float] = None
    cantidad: Optional[int] = 1


class IntentClassification(BaseModel):
    intent: IntentType
    parameters: IntentParameters = Field(default_factory=IntentParameters)
    requires_admin: bool = False
    is_destructive: bool = False
    confidence: float = 1.0


class ToolResult(BaseModel):
    tool: str
    success: bool
    payload: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    tool_results: List[ToolResult] = Field(default_factory=list)
    ui_actions: List[UIAction] = Field(default_factory=list)
    toolUsed: Optional[str] = None
    toolData: Optional[Dict[str, Any]] = None
    riskLevel: str = "SAFE"
    riskScore: int = 0
    blockedByShield: bool = False
    auditNotes: List[str] = Field(default_factory=list)
