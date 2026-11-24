"""
Structured Intent & Parameter Extraction using Gemini Flash + Pydantic.
Replaces brittle regex parsers with deterministic, schema-validated outputs.
Includes deterministic rule fallback for resilience.
"""

import json
import logging
import re
import urllib.request
import urllib.error
from typing import Optional
from mcp_service.config import settings
from mcp_service.schemas.ui_actions import (
    IntentClassification,
    IntentType,
    IntentParameters,
)

logger = logging.getLogger("mcp-structured-extractor")

INTENT_EXTRACTION_PROMPT = """Eres el clasificador de intenciones del sistema de café de especialidad "Sistema Café".
Tu tarea es clasificar la consulta del usuario y extraer sus parámetros de forma estrictamente estructurada.

INTENCIONES POSIBLES:
1. CREAR_PRODUCTO: El usuario desea crear, registrar o agregar un nuevo café o lote al catálogo (ej. "Crea un cafe con agua a 1 dolar", "agrega cafe con chocolate a 2.50").
2. ACTUALIZAR_PRECIO: Actualizar precio de un producto por SKU o nombre.
3. DESACTIVAR_PRODUCTO: Desactivar o eliminar un café específico por SKU.
4. ADD_TO_CART: Añadir un café al carrito o pedirlo (ej. "añade al carrito un cafe de chocolate", "quiero comprar dos bolsas de etiocafé").
5. CONSULTAR_STOCK: Preguntar por existencias, stock bajo, alertas o inventario de bodega.
6. LISTAR_PRODUCTOS: Preguntar qué cafés hay, cuántos hay en carta o catálogo ("¿cuántos cafés tienen disponibles?", "qué cafés tienen").
7. BUSCAR_PRODUCTO: Buscar por notas de cata, país de origen, método o palabra clave ("busca cafés con notas a chocolate", "muéstrame cafés de Colombia").
8. RECOMENDAR_CAFE: Pedir sugerencia o recomendación personalizada ("qué café me recomiendas", "recomiéndame algo dulce").
9. RECETA_BARISTA: Preguntar recetas técnicas, molienda, V60, Chemex, Aeropress o Espresso.
10. RASTREAR_PEDIDO: Consultar estado de una orden (ej. ORD-2026-0001) o historial de compras.
11. RESETEO_CATALOGO: Solicitud de borrado masivo, vaciado o reseteo total del catálogo ("elimina todos los cafés", "borra todo").
12. CONFIRMAR_ACCION: El usuario confirma una acción previa que requería confirmación ("proceder con el reseteo", "opcion b", "sí, elimínalos todos").
13. CONVERSACION_GENERAL: Saludos ("hola"), preguntas generales o consultas fuera de las herramientas.

FORMATO DE RESPUESTA EXIGIDO:
Debes responder ÚNICAMENTE con un objeto JSON válido (sin formato Markdown, sin ```json ni ```):
{
  "intent": "<NOMBRE_DE_LA_INTENCION>",
  "parameters": {
    "nombre": "<nombre_del_cafe_o_null>",
    "precio": <precio_flotante_o_null>,
    "tueste": "<LIGHT|MEDIUM|DARK|null>",
    "origen": "<origen_o_null>",
    "categoria": "<ESPRESSO_SINGLE_ORIGIN|SPECIALTY_BEANS|COLD_BREW_BLEND|DECAF_ORGANIC|null>",
    "stockInicial": <entero_o_null>,
    "notasCata": "<notas_o_descripcion_o_null>",
    "sku": "<sku_o_null>",
    "query": "<texto_de_busqueda_o_null>",
    "notasDeseadas": "<notas_de_cata_buscadas_o_null>",
    "numeroOrden": "<orden_o_null>",
    "metodo": "<V60|CHEMEX|AEROPRESS|ESPRESSO|null>",
    "gramos": <gramos_o_null>,
    "cantidad": <entero_o_1>
  },
  "requires_admin": <true_o_false>,
  "is_destructive": <true_o_false>,
  "confidence": 1.0
}
"""


def extract_intent_fallback(user_text: str, user_role: str) -> IntentClassification:
    """
    Deterministic rule-based fallback if Gemini API is temporarily unavailable.
    """
    clean = user_text.strip()
    msg_lower = clean.lower()
    is_admin = "ADMIN" in (user_role or "").upper()

    # 1. Confirmation of pending critical action
    if any(p in msg_lower for p in [
        "proceder con el reseteo", "confirmo el reseteo", "reseteo completo",
        "reseteo total", "opcion b", "opción b", "elimina todo y no hay motivo"
    ]):
        return IntentClassification(
            intent=IntentType.CONFIRMAR_ACCION,
            parameters=IntentParameters(),
            requires_admin=True,
            is_destructive=True,
            confidence=0.95
        )

    # 2. Reset or delete all
    if any(p in msg_lower for p in ["elimina todos", "borra todos", "elimines todos", "borres todos", "vaciar catalogo", "vaciar catálogo"]):
        return IntentClassification(
            intent=IntentType.RESETEO_CATALOGO,
            parameters=IntentParameters(),
            requires_admin=True,
            is_destructive=True,
            confidence=0.98
        )

    # 3. Add to cart
    if any(w in msg_lower for w in ["carrito", "carro", "canasta", "añda", "añade al", "agrega al", "añadir al", "comprar un", "pedir un"]):
        target_name = None
        for cand in ["chocolate", "americano", "descafeinado", "leche", "etiopía", "huila", "guatemala"]:
            if cand in msg_lower:
                target_name = cand
                break
        return IntentClassification(
            intent=IntentType.ADD_TO_CART,
            parameters=IntentParameters(query=target_name or clean),
            requires_admin=False,
            confidence=0.95
        )

    # 4. Create product
    if any(trig in msg_lower for trig in ["crea", "crear", "agrega", "agregar", "nuevo café", "nuevo cafe", "registra", "registrar", "pon un cafe"]):
        # Extract price if present
        price = 3.50
        pm = re.search(r'(?:precio\s+(?:sea\s+(?:de\s+)?)?|a|por|\$)\s*(\d+(?:[.,]\d+)?)', clean, re.IGNORECASE)
        if pm:
            try:
                price = float(pm.group(1).replace(',', '.'))
            except ValueError:
                pass

        # Extract name
        name_m = re.search(r'(?:agrega|crea|añade|registra|pon)\s+(?:un\s+|el\s+)?([^,;\$]+)', clean, re.IGNORECASE)
        name = name_m.group(1).strip() if name_m else "Café de Especialidad"
        name = re.sub(r'\s+(?:y\s+el\s+precio|a\s+\d+|por\s+\d+|con\s+precio).*$', '', name, flags=re.IGNORECASE).strip()

        return IntentClassification(
            intent=IntentType.CREAR_PRODUCTO,
            parameters=IntentParameters(
                nombre=name.capitalize(),
                precio=price,
                stockInicial=50,
                categoria="SPECIALTY_BEANS",
                tueste="MEDIUM"
            ),
            requires_admin=True,
            confidence=0.92
        )

    # 5. Search product
    if any(w in msg_lower for w in ["busca", "buscar", "muéstrame cafés", "muestrame cafes", "notas a"]):
        # Extract search term
        q = clean
        qm = re.search(r'(?:busca|buscar|con notas a|muéstrame|muestrame)\s+(.+)', clean, re.IGNORECASE)
        if qm:
            q = qm.group(1).strip()
        return IntentClassification(
            intent=IntentType.BUSCAR_PRODUCTO,
            parameters=IntentParameters(query=q),
            confidence=0.9
        )

    # 6. List products
    if any(w in msg_lower for w in ["cuantos", "cuántos", "que cafés", "qué cafés", "carta", "menú", "menu", "catálogo", "catalogo", "disponibles"]):
        return IntentClassification(
            intent=IntentType.LISTAR_PRODUCTOS,
            parameters=IntentParameters(),
            confidence=0.95
        )

    return IntentClassification(
        intent=IntentType.CONVERSACION_GENERAL,
        parameters=IntentParameters(query=clean),
        confidence=0.8
    )


def classify_user_intent(user_message: str, user_role: str = "ROLE_CUSTOMER") -> IntentClassification:
    """
    Classifies user message into structured Pydantic schema using Gemini Flash (temperature=0),
    with robust fallback.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return extract_intent_fallback(user_message, user_role)

    models_to_try = [
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
    ]

    payload = {
        "system_instruction": {
            "parts": [{"text": INTENT_EXTRACTION_PROMPT}]
        },
        "contents": [{
            "role": "user",
            "parts": [{"text": f"Rol del usuario: {user_role}\nMensaje: {user_message}"}]
        }],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
            "maxOutputTokens": 350,
        }
    }

    body_bytes = json.dumps(payload).encode("utf-8")

    for model in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            req = urllib.request.Request(
                url,
                data=body_bytes,
                headers={"Content-Type": "application/json; charset=utf-8"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        raw_json = parts[0].get("text", "").strip()
                        parsed = json.loads(raw_json)
                        validated = IntentClassification(**parsed)
                        logger.info(f"Gemini structured intent extracted: {validated.intent}")
                        return validated
        except Exception as exc:
            logger.debug(f"Gemini extraction attempt with {model} failed: {exc}")
            continue

    return extract_intent_fallback(user_message, user_role)
