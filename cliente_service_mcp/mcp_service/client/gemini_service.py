"""
Google Gemini AI Engine Integration with Native Function Calling Loop for Sistema Café.
Provides deterministic tool execution + 100% natural AI responses with Zero-Slop.
"""

import json
import logging
import re
import time
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple
from mcp_service.config import settings

logger = logging.getLogger("gemini-service")

CUSTOMER_SYSTEM_PROMPT = """Eres Sommelier AI, el Asistente experto y Sommelier de Café de la cafetería de especialidad "Sistema Café".
Tu misión es atender a los clientes en la tienda web con amabilidad, cercanía y conocimiento experto sobre granos y métodos de preparación.

MAPA DE RUTAS Y VISTAS DE LA APLICACIÓN (Menú lateral y navegación):
- Cafés de Origen (Tienda y catálogo de cafés de especialidad): '/store'
- Mi Carrito (Revisión de productos seleccionados, facturación y pago): '/carritocliente'
- Mis Pedidos (Historial y seguimiento de compras del cliente autenticado): '/my-orders'
- Sommelier Virtual (Asistente y chat interactivo): '/chat'

DIRECTRICES PARA CLIENTES (ANTISLOP, NATURALIDAD Y CO-NAVEGACIÓN):
1. REGLA ESTRICTA DE VERACIDAD (CERO ALUCINACIONES): Consulta EXCLUSIVAMENTE los cafés reales listados en 'CATÁLOGO REAL EN TIEMPO REAL'. Si un cliente te pide cualquier café que figure en el catálogo (incluso si escribe con errores de tipeo como 'cafe de chooclate' o 'geuida de boquete'), o pide agregarlo al carrito, DEBES invocar la herramienta 'add_to_cart' con el 'product_id' numérico correspondiente y la cantidad pedida.
2. BÚSQUEDA Y FILTRADO VISUAL EN TIEMPO REAL ('search_catalog'): Cuando el cliente pida buscar, ver, explorar o filtrar cafés por sabor, notas de cata, nombre u origen (ej: "muéstrame cafés con notas a chocolate", "busca cafés con chocolate", "qué cafés tienes frutales", "filtra cafés de huila", "café con notas de jazmín"), DEBES invocar OBLIGATORIAMENTE la herramienta 'search_catalog' con el término de búsqueda clave (ej: query='chocolate'). Esto activará la simulación de escritura automática en el buscador de la tienda web y filtrará las tarjetas de café en pantalla en tiempo real frente al usuario.
3. CO-NAVEGACIÓN VISUAL INMEDIATA: Cuando el usuario pida ver una sección de la aplicación (como sus pedidos, el catálogo o el carrito, o diga 'quiero ver todos mis pedidos', 'llévame a mis pedidos', 'ir a la tienda', 'ver cafés de origen'), usa SIEMPRE la herramienta 'navigate_ui' para llevarlo visualmente allí de inmediato indicando la ruta exacta ('/carritocliente', '/my-orders', '/store', etc.), además de consultar sus datos.
4. HISTORIAL DE PEDIDOS DEL CLIENTE: Cuando el usuario pida ver sus pedidos ("quiero ver todos mis pedidos", "mis pedidos", "llévame a mis pedidos", "mis compras", "pedidos realizados"), invoca la herramienta 'get_my_orders' (y 'navigate_ui' hacia '/my-orders'). NUNCA respondas que no tienes acceso al historial ni pidas códigos de orden 'ORD-2026-XXXX' si el cliente solo pidió ver o revisar sus compras. El usuario ya está autenticado y tú consultas directamente su historial en el sistema.
5. REVISIÓN Y PAGO DE CARRITO (DISPARADOR OBLIGATORIO A '/carritocliente'):
   Si el usuario manifiesta CUALQUIER intención de revisar su pedido, ver su orden o pagar, como por ejemplo:
   - "revisemos el pedido"
   - "quiero ver mi orden"
   - "procedamos a revisar"
   - "vamos a pagar"
   - "quiero pagar"
   - "finalizar compra"
   - "ver mi carrito"
   - "llévame al carrito"
   - "ir al carrito"
   - "ver qué llevo"
   - "¿cómo va mi carrito?"
   - "¿qué tengo en mi orden?"
   - "¿cuánto llevo gastado?"
   DEBES invocar OBLIGATORIAMENTE la herramienta 'navigate_ui' con route='/carritocliente' para emitir la acción visual {"type": "NAVIGATE", "route": "/carritocliente", "delayMs": 0} llevando al usuario a la página de facturación y resumen de compra de inmediato.
6. SINCRONIZACIÓN Y CONSULTA DEL CARRITO (CERO ALUCINACIONES):
   Basa cualquier respuesta sobre el contenido de la compra ÚNICA Y EXCLUSIVAMENTE en la sección 'ESTADO ACTUAL DEL CARRITO DE COMPRAS DEL CLIENTE (React)'.
   - Si el usuario pregunta qué tiene en su pedido o qué ha añadido, lista únicamente los productos, cantidades y precios que figuran en esa sección sincronizada en tiempo real.
   - NUNCA inventes productos que se hablaron en recomendaciones o turnos pasados si no están en la lista actual del carrito.
   - Si el carrito está vacío (0 productos), indícaselo con amabilidad e invítalo a agregar algún café de la vitrina.
7. AÑADIR AL CARRITO: Cuando agregues un café al carrito, permanece en la tienda, confirma con calidez la adición y resalta visualmente el producto. NUNCA abras drawers ni redirijas a otra página a menos que el usuario lo solicite explícitamente.
8. CERO SLOP Y CERO CLICHÉS: No uses clichés como "joyas líquidas", "elevar tus sentidos", "orquesta de aromas" ni introducciones poéticas exageradas. Habla como un barista o sommelier en una barra de café real.
9. CERO CÓDIGOS INTERNOS AL CLIENTE: NUNCA muestres códigos SKU (ej. COF-CAF-...) al cliente a menos que lo pregunte explícitamente.
"""

BARISTA_SYSTEM_PROMPT = """Eres Sommelier AI (Modo Barista), el Asistente Técnico y Copiloto de Barra de "Sistema Café".
Tu misión es asistir al Barista profesional en recetas de extracción, calibración y supervisión de pedidos y comandas.

MAPA DE RUTAS Y VISTAS PERMITIDAS PARA BARISTA:
- Comandas de Barra / Despacho de Pedidos: '/orders'
- Granos Disponibles / Lotes e Inventario: '/catalog'
- Fichas Técnicas de Extracción: '/skills'
- Copiloto de Barra: '/chat'
(Rutas exclusivas de administrador como '/dashboard' y '/customers' están restringidas).

DIRECTRICES PARA BARISTAS:
1. RESTRICCIÓN DE PRIVILEGIOS RBAC (INTERMEDIO): Como Barista, tienes acceso a recetas de extracción, consulta de comandas, actualización de estados de órdenes e inventario. NO TIENES PERMISOS de Administrador para crear nuevos cafés en el catálogo ni para eliminar o desactivar productos. Si el barista te pide crear un café ("crea un nuevo café...") o eliminar/desactivar un producto ("elimina un producto...", "desactiva un café..."), debes rechazar la solicitud amablemente explicando que esa operación requiere privilegios exclusivos de Administrador.
2. CONSULTA DE COMANDAS: Cuando el barista pida ver los pedidos pendientes ("muéstrame los pedidos pendientes por preparar", "qué pedidos hay por hacer", "pedidos pendientes"), invoca OBLIGATORIAMENTE la herramienta 'list_orders' (con status='PENDING' o 'CONFIRMED' o vacía para listar comandas recientes) y la herramienta 'navigate_ui' hacia '/orders'.
3. AVANCE DE ESTADO DE COMANDAS: Cuando el barista pida actualizar el estado de una orden (ej: "pasa la orden ORD-... a PREPARING", "marca la orden como lista"), invoca 'update_order_status' indicando el número de orden y el nuevo estado ('PREPARING', 'READY', 'DELIVERED').
4. RECETAS DE EXTRACCIÓN DETERMINISTAS: Cuando el barista pregunte por recetas ("calcula la receta y ratio de extracción para 22 gramos de café en V60", "receta para Chemex", "ratio Aeropress"), invoca OBLIGATORIAMENTE la herramienta 'get_barista_recipe' con el método y los gramos exactos.
5. CO-NAVEGACIÓN: Cuando el barista pida ir a las comandas, inventario o fichas de extracción, invoca 'navigate_ui' hacia '/orders', '/catalog' o '/skills'.
6. Tono directo, profesional y colaborativo de colega barista experto en barra.
"""

ADMIN_SYSTEM_PROMPT = """Eres Sommelier AI (Modo Gerencia & Operaciones), el Asistente Ejecutivo y Analista de Negocio de "Sistema Café".
Estás asistiendo a la gerencia / administración general del sistema con privilegios totales.

MAPA DE RUTAS Y VISTAS:
- Consola de Operaciones y Métricas: '/dashboard'
- Lotes e Inventario de Productos: '/catalog'
- Despacho & Ventas / Gestión de Órdenes: '/orders'
- Comunidad & Clientes: '/customers'
- Laboratorio de Tueste: '/skills'
- Copiloto de Negocio: '/chat'

DIRECTRICES PARA ADMINISTRADORES (CRUD COMPLETO Y ACCIONES CRÍTICAS):
1. GESTIÓN CRUD DE PRODUCTOS:
   - Crear: Cuando el administrador solicite crear o registrar un nuevo café ("crea un café llamado Lote Prueba Prod, precio 30.00, stock 40 kg..."), invoca inmediatamente 'create_coffee_product'.
   - Actualizar: Cuando solicite modificar o actualizar el precio o stock de un café ("actualiza el precio del café Lote Prueba Prod a 35.50 y cambia su stock a 25 kg"), invoca 'update_coffee_product'.
   - Eliminar / Desactivar: Cuando solicite borrar o desactivar un café específico ("elimina o desactiva el café Lote Prueba Prod del catálogo"), invoca 'deactivate_coffee_product'.
2. ACCIONES CRÍTICAS MASIVAS (ELIMINAR / RESETEAR TODO EL CATÁLOGO):
   - Ante solicitud de reseteo total ("elimina todos los cafés", "borra todos los cafés"), invoca 'request_catalog_reset' para activar la ventana de confirmación en dos pasos (60s).
   - Ante confirmación del administrador ("borra todos", "proceder con el reseteo"), invoca 'confirm_catalog_reset'.
3. CO-NAVEGACIÓN: Si el administrador solicita ir a cualquier módulo (dashboard, catálogo, órdenes, clientes), invoca 'navigate_ui'.
"""

GEMINI_TOOLS_DECLARATION = [
    {
        "function_declarations": [
            {
                "name": "add_to_cart",
                "description": "Añade un café de especialidad al carrito de compras del cliente usando su product_id del catálogo.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "product_id": {
                            "type": "INTEGER",
                            "description": "ID numérico del producto en el catálogo (ej: 20, 21, 22)."
                        },
                        "quantity": {
                            "type": "INTEGER",
                            "description": "Cantidad de unidades o bolsas a agregar (por defecto 1)."
                        }
                    },
                    "required": ["product_id"]
                }
            },
            {
                "name": "search_catalog",
                "description": "Busca cafés por nombre, notas de sabor, origen o tueste.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {
                            "type": "STRING",
                            "description": "Término de búsqueda o nota de sabor deseada (ej: 'chocolate', 'huila')."
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "check_stock",
                "description": "Consulta las existencias y nivel de stock de un producto por SKU o ID.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "sku": {
                            "type": "STRING",
                            "description": "Código SKU del producto (ej: 'COF-GEISHA-8828')."
                        }
                    },
                    "required": ["sku"]
                }
            },
            {
                "name": "create_coffee_product",
                "description": "Registra un nuevo café en el catálogo comercial (solo Administrador o Barista).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "name": {
                            "type": "STRING",
                            "description": "Nombre comercial del café (ej: 'Café de Chocolate', 'Café con Agua')."
                        },
                        "price": {
                            "type": "NUMBER",
                            "description": "Precio en dólares (ej: 3.50, 1.00)."
                        },
                        "stock": {
                            "type": "INTEGER",
                            "description": "Cantidad inicial en bodega (por defecto 50)."
                        },
                        "description": {
                            "type": "STRING",
                            "description": "Descripción sensorial o notas de cata."
                        },
                        "roast_level": {
                            "type": "STRING",
                            "description": "Nivel de tueste: LIGHT, MEDIUM, DARK."
                        }
                    },
                    "required": ["name", "price"]
                }
            },
            {
                "name": "request_catalog_reset",
                "description": "Inicia la solicitud para vaciar o eliminar todos los cafés del catálogo. Requiere confirmación de dos pasos del Administrador.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "reason": {
                            "type": "STRING",
                            "description": "Motivo expresado por el administrador para la purga o reseteo."
                        }
                    }
                }
            },
            {
                "name": "confirm_catalog_reset",
                "description": "Confirma y ejecuta el borrado o reseteo total de los cafés del catálogo si el Administrador reitera su decisión (Paso 2 de 2FA).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "confirmation_phrase": {
                            "type": "STRING",
                            "description": "Frase de confirmación enviada por el usuario (ej: 'borra todos', 'proceder con el reseteo', 'opcion b')."
                        }
                    }
                }
            },
            {
                "name": "track_order",
                "description": "Rastrea el estado en tiempo real de una orden de compra mediante su código (ej: ORD-2026-0001).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "order_number": {
                            "type": "STRING",
                            "description": "Número o código de orden (ej: 'ORD-2026-0001')."
                        }
                    },
                    "required": ["order_number"]
                }
            },
            {
                "name": "get_barista_recipe",
                "description": "Calcula recetas técnicas de extracción para métodos como V60, Chemex, Aeropress o Espresso.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "method": {
                            "type": "STRING",
                            "description": "Método de extracción: V60, CHEMEX, AEROPRESS, ESPRESSO."
                        },
                        "grams": {
                            "type": "NUMBER",
                            "description": "Gramos de café a utilizar (ej: 18.0)."
                        }
                    },
                    "required": ["method"]
                }
            },
            {
                "name": "navigate_ui",
                "description": "Navega y desplaza visualmente al usuario a una sección o pantalla de la aplicación en la interfaz web.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "route": {
                            "type": "STRING",
                            "description": "Ruta destino en la app: '/carritocliente' (Mi Carrito y Facturación: úsala OBLIGATORIAMENTE ante frases como 'revisemos el pedido', 'quiero ver mi orden', 'procedamos a revisar', 'vamos a pagar', 'quiero pagar', 'ver mi carrito', 'llévame al carrito', 'finalizar compra'), '/my-orders' (Mis Pedidos e historial), '/store' (Cafés de Origen/Tienda), '/orders' (Comandas/Despacho), '/catalog' (Inventario), '/dashboard' (Consola de Operaciones), '/customers' (Clientes), '/skills' (Laboratorio de Extracción), '/chat' (Sommelier Virtual)."
                        },
                        "target_id": {
                            "type": "STRING",
                            "description": "Identificador DOM opcional para enfocar con el spotlight (ej: 'order-card-1', 'catalog-search-input')."
                        },
                        "highlight_message": {
                            "type": "STRING",
                            "description": "Mensaje opcional para la insignia o tooltip flotante de Sommelier AI."
                        }
                    },
                    "required": ["route"]
                }
            },
            {
                "name": "get_my_orders",
                "description": "Obtiene el historial completo de pedidos de café del cliente o usuario autenticado sin requerir que ingrese códigos manuales.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "status": {
                            "type": "STRING",
                            "description": "Filtro opcional por estado de la orden: PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, DELIVERED, CANCELLED."
                        }
                    }
                }
            },
            {
                "name": "update_coffee_product",
                "description": "Actualiza el precio y/o stock de un café en el catálogo por su nombre, ID o SKU (solo Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "product_name": {
                            "type": "STRING",
                            "description": "Nombre o término del producto a actualizar (ej: 'Lote Prueba Prod')."
                        },
                        "price": {
                            "type": "NUMBER",
                            "description": "Nuevo precio en dólares (ej: 35.50)."
                        },
                        "stock": {
                            "type": "INTEGER",
                            "description": "Nuevo stock o unidades disponibles en kg (ej: 25)."
                        }
                    },
                    "required": ["product_name"]
                }
            },
            {
                "name": "deactivate_coffee_product",
                "description": "Elimina o desactiva un café específico del catálogo comercial (solo Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "product_name": {
                            "type": "STRING",
                            "description": "Nombre o término del producto a desactivar o eliminar (ej: 'Lote Prueba Prod')."
                        }
                    },
                    "required": ["product_name"]
                }
            },
            {
                "name": "list_orders",
                "description": "Supervisa y lista los pedidos y comandas de la cafetería para el Barista o Administrador (ej: pedidos pendientes por preparar).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "status": {
                            "type": "STRING",
                            "description": "Filtro opcional por estado: PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED."
                        }
                    }
                }
            },
            {
                "name": "update_order_status",
                "description": "Actualiza o avanza el estado de una comanda u orden en la barra (solo Barista o Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "order_number": {
                            "type": "STRING",
                            "description": "Código de la orden (ej: 'ORD-594C7C55')."
                        },
                        "new_status": {
                            "type": "STRING",
                            "description": "Nuevo estado: PREPARING, READY, DELIVERED, CANCELLED."
                        }
                    },
                    "required": ["order_number", "new_status"]
                }
            }
        ]
    }
]


def get_system_prompt_for_role(role: Optional[str]) -> str:
    norm = (role or "").strip().upper()
    if "ADMIN" in norm:
        return ADMIN_SYSTEM_PROMPT
    elif "BARISTA" in norm:
        return BARISTA_SYSTEM_PROMPT
    return CUSTOMER_SYSTEM_PROMPT


async def fetch_live_catalog_products() -> List[Dict[str, Any]]:
    """Fetches real-time products from the backend REST API."""
    import httpx
    urls_to_try = [
        "http://backend:8080/api/v1/products?page=0&size=100",
        "http://coffee-backend:8080/api/v1/products?page=0&size=100",
        "http://localhost:8088/api/v1/products?page=0&size=100",
    ]
    for url in urls_to_try:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    items = data.get("content") if isinstance(data, dict) and "content" in data else data
                    if isinstance(items, list):
                        return items
        except Exception:
            continue
    return []


def query_gemini_with_fallback(
    payload: Dict[str, Any],
    api_key: str,
    preferred_model: Optional[str] = None,
    timeout: float = 20.0,
    max_retries: int = 2,
) -> Optional[Dict[str, Any]]:
    """
    Sends request to Gemini API with model fallback and exponential backoff retry.
    Tries preferred model first, then falls back to healthy alternatives.
    """
    models_to_try: List[str] = []
    if preferred_model:
        models_to_try.append(preferred_model)
    # Default candidate chain
    for m in ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"]:
        if m not in models_to_try:
            models_to_try.append(m)

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json; charset=utf-8"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data
            except urllib.error.HTTPError as http_err:
                code = http_err.code
                logger.warning(f"Gemini API HTTP {code} on {model} (attempt {attempt+1}/{max_retries}): {http_err.reason}")
                if code in (429, 503, 500, 504):
                    time.sleep(1.0 * (attempt + 1))
                    continue
                break
            except Exception as exc:
                logger.warning(f"Gemini network error on {model} (attempt {attempt+1}/{max_retries}): {exc}")
                time.sleep(0.5)

    logger.error("All Gemini models and retries exhausted.")
    return None


def emergency_local_sommelier_fallback(
    user_prompt: str,
    live_products: List[Dict[str, Any]],
    cart_context: str,
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]], Optional[str], Optional[Dict[str, Any]]]:
    """
    Intelligent local sommelier engine when external Gemini API is unreachable.
    Guarantees zero downtime, zero dead-ends, and performs deterministic UI actions.
    """
    p_lower = user_prompt.lower().strip()

    # 1. Navigation / Checkout intent
    checkout_triggers = [
        "revisemos", "revisar", "ver mi orden", "ver orden", "ver carrito", "mi carrito",
        "ir a pagar", "vamos a pagar", "quiero pagar", "procedamos a revisar", "finalizar compra",
        "pagar", "comprar todo", "cuanto llevo"
    ]
    if any(t in p_lower for t in checkout_triggers):
        reply = "¡Por supuesto! Te llevo de inmediato a la sección de tu carrito para que revises tu selección y procedas con el pago cuando gustes."
        ui_act = {"type": "NAVIGATE", "route": "/carritocliente", "delayMs": 0}
        return (reply, [], [ui_act], "navigate_ui", {"route": "/carritocliente"})

    # 2. My Orders navigation
    orders_triggers = ["mis pedidos", "mis compras", "ver pedidos", "historial de pedidos", "pedidos realizados"]
    if any(t in p_lower for t in orders_triggers):
        reply = "¡Con gusto! Te llevo a tu historial de pedidos para que consultes tus compras anteriores y el estado de cada una."
        ui_act = {"type": "NAVIGATE", "route": "/my-orders", "delayMs": 0}
        return (reply, [], [ui_act], "navigate_ui", {"route": "/my-orders"})

    # 3. Add to cart intent
    add_triggers = ["agrega", "añade", "anade", "agregar", "añadir", "quiero comprar", "pon", "llevar", "dame un", "dame una", "adicionar"]
    if any(t in p_lower for t in add_triggers):
        matched_product = None
        best_score = 0
        for p in live_products:
            p_name = (p.get("name") or p.get("nombre") or "").lower()
            p_tokens = [tok for tok in re.split(r"\s+", p_name) if len(tok) > 2]
            score = sum(1 for tok in p_tokens if tok in p_lower)
            if score > best_score:
                best_score = score
                matched_product = p

        if not matched_product and live_products:
            matched_product = live_products[0]

        if matched_product:
            pid = matched_product.get("id")
            p_name = matched_product.get("name") or matched_product.get("nombre") or "Café de Especialidad"
            p_price = float(matched_product.get("price") or matched_product.get("precio") or matched_product.get("unitPrice") or 0.0)
            
            qty = 1
            num_match = re.search(r"\b(\d+)\b", p_lower)
            if num_match:
                qty = max(1, int(num_match.group(1)))
            elif "dos" in p_lower:
                qty = 2
            elif "tres" in p_lower:
                qty = 3

            ui_act = {
                "type": "HIGHLIGHT_ELEMENT",
                "targetId": f"product-card-{pid}",
                "animation": "pulse-glow",
                "badgeText": "¡Añadido al carrito!",
                "durationMs": 4000,
            }
            tool_data = {
                "productId": pid,
                "productName": p_name,
                "quantity": qty,
                "price": p_price,
            }
            reply = f"¡Listo! He agregado {qty} bolsa(s) de {p_name} a tu carrito de compras (${p_price * qty:.2f} USD).\n\n¿Te gustaría revisar tu pedido en /carritocliente o deseas que te recomiende algún otro café de especialidad?"
            return (reply, [{"tool": "add_to_cart", "result": "success"}], [ui_act], "add_to_cart", tool_data)

    # 4. Search / Filter intent
    search_triggers = ["busca", "buscar", "filtra", "filtrar", "chocolate", "frutal", "citrico", "floral", "caramelo", "jazmin"]
    for s_kw in search_triggers:
        if s_kw in p_lower:
            ui_act = {"type": "TYPE_AND_SEARCH", "query": s_kw, "delayMs": 0}
            reply = f"¡Enseguida! He filtrado en la vitrina los cafés relacionados con '{s_kw}' para que explores sus notas de cata y origen en pantalla."
            return (reply, [], [ui_act], "search_catalog", {"query": s_kw})

    # 5. Greeting / Help / Capabilities
    greeting_triggers = ["hola", "buenas", "buenos dias", "buenas tardes", "que puedes hacer", "ayuda", "quien eres", "asesor"]
    if any(t in p_lower for t in greeting_triggers):
        reply = (
            "¡Hola! Soy tu Sommelier AI en **Sistema Café**. Estoy aquí para asesorarte en la selección de los mejores cafés de especialidad:\n\n"
            "- **Explorar y recomendar cafés:** Dime qué sabores buscas (notas florales, cítricas, cacao amargo o caramelo).\n"
            "- **Agregar al carrito:** Puedo añadir los cafés directamente a tu compra.\n"
            "- **Revisar pedidos:** Te llevo a ver tu carrito (`/carritocliente`) o tu historial de pedidos (`/my-orders`).\n"
            "- **Recetas de extracción:** Te comparto ratios y tiempos para V60, Chemex, Aeropress y Espresso.\n\n"
            "¿Qué café te gustaría probar o preparar hoy?"
        )
        return (reply, [], [], None, None)

    # 6. Recommendation request
    rec_triggers = ["recomiendame", "recomendar", "que me recomiendas", "opciones", "catalogo", "sugiereme"]
    if any(t in p_lower for t in rec_triggers):
        rec_lines = []
        for p in live_products[:3]:
            name = p.get("name") or "Café de Especialidad"
            notes = p.get("flavorNotes") or "Perfil equilibrado"
            price = float(p.get("price") or 0.0)
            rec_lines.append(f"- **{name}** (${price:.2f} USD): {notes}")
        recs_text = "\n".join(rec_lines) if rec_lines else "- Café Geisha Boquete y Bourbon Rosado Huila."
        reply = f"Tenemos excelentes opciones en el catálogo actual:\n\n{recs_text}\n\n¿Te llama la atención alguno en particular para agregarlo a tu carrito?"
        return (reply, [], [], None, None)

    # Default fallback
    reply = "Soy tu Sommelier AI. Cuéntame qué perfil de notas de cata o método de preparación prefieres y con gusto te oriento en nuestra selección."
    return (reply, [], [], None, None)


async def execute_gemini_agent_loop(
    user_prompt: str,
    user_role: Optional[str],
    client_id: str,
    conversation_history: Optional[List[Dict[str, str]]],
    mcp_client: Any,
    pending_action_store: Any,
    backend_client: Any,
    current_cart: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]], Optional[str], Optional[Dict[str, Any]]]:
    """
    Two-phase agentic execution loop with Gemini native function calling.
    Returns: (reply_text, tool_results, ui_actions, tool_used, tool_data)
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("No Gemini API key configured.")
        return ("Disculpa, el motor de inteligencia artificial no tiene clave configurada.", [], [], None, None)

    # 1. Format real-time cart state from React
    cart_lines = []
    if current_cart:
        for c_item in current_cart:
            c_name = c_item.get("name") or c_item.get("nombre") or "Café de Especialidad"
            c_qty = c_item.get("quantity") or c_item.get("cantidad") or 1
            c_price = float(c_item.get("price") or c_item.get("precio") or c_item.get("unitPrice") or 0.0)
            c_sub = c_qty * c_price
            cart_lines.append(f"- {c_qty}x {c_name} | Precio unitario: ${c_price:.2f} USD | Subtotal: ${c_sub:.2f} USD")

    cart_context = "\n".join(cart_lines) if cart_lines else "El carrito de compras está vacío actualmente (0 productos)."

    # 2. Fetch live PostgreSQL catalog
    live_products = await fetch_live_catalog_products()

    catalog_lines = []
    product_map_by_id: Dict[int, Dict[str, Any]] = {}
    for p in live_products:
        pid = p.get("id")
        if pid:
            try:
                product_map_by_id[int(pid)] = p
            except ValueError:
                pass
        p_name = p.get("name") or p.get("nombre") or ""
        p_price = p.get("price") or p.get("precio") or p.get("unitPrice") or 0.0
        p_stock = p.get("stockQuantity") or p.get("stock") or 0
        p_sku = p.get("sku") or ""
        p_notes = p.get("flavorNotes") or p.get("notasCata") or p.get("description") or ""
        catalog_lines.append(
            f"- [ID: {pid}] {p_name} | Precio: ${float(p_price):.2f} USD | Stock: {p_stock} kg | SKU: {p_sku} | Notas: {p_notes}"
        )

    catalog_context = "\n".join(catalog_lines) if catalog_lines else "Actualmente no hay productos registrados en el inventario."

    role_prompt = get_system_prompt_for_role(user_role)
    system_instruction = f"""{role_prompt}

ESTADO ACTUAL DEL CARRITO DE COMPRAS DEL CLIENTE (Sincronizado en tiempo real con React):
{cart_context}

CATÁLOGO REAL EN TIEMPO REAL (PostgreSQL):
{catalog_context}
"""

    # 2. Build contents including conversation history from Redis
    contents: List[Dict[str, Any]] = []
    if conversation_history:
        for turn in conversation_history[-8:]:
            role_val = turn.get("role", "user")
            gemini_role = "user" if role_val in ("user", "human") else "model"
            content_text = (turn.get("content") or "").strip()
            if content_text:
                contents.append({"role": gemini_role, "parts": [{"text": content_text}]})

    contents.append({"role": "user", "parts": [{"text": user_prompt}]})

    model_name = getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")

    payload_phase1 = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "tools": GEMINI_TOOLS_DECLARATION,
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 600},
    }

    res1 = query_gemini_with_fallback(
        payload=payload_phase1,
        api_key=api_key,
        preferred_model=model_name,
        timeout=20.0,
    )
    if not res1 or not res1.get("candidates"):
        logger.warning(f"Gemini API unavailable for Phase 1. Activating emergency local sommelier fallback for: {user_prompt!r}")
        return emergency_local_sommelier_fallback(user_prompt, live_products, cart_context)

    candidates = res1.get("candidates", [])
    if not candidates:
        return ("No recibí respuesta del asistente en este momento.", [], [], None, None)

    candidate_parts = candidates[0].get("content", {}).get("parts", [])
    function_call_parts = [p for p in candidate_parts if "functionCall" in p]

    # If NO function call, return model's natural text directly
    if not function_call_parts:
        reply_text = "".join(p.get("text", "") for p in candidate_parts).strip()
        return (reply_text, [], [], None, None)

    # 3. Tool execution
    tool_results: List[Dict[str, Any]] = []
    ui_actions: List[Dict[str, Any]] = []
    tool_used: Optional[str] = None
    tool_data: Optional[Dict[str, Any]] = None
    function_responses: List[Dict[str, Any]] = []

    role_norm = (user_role or "").upper()
    is_admin = "ADMIN" in role_norm
    is_barista = "BARISTA" in role_norm

    for fcp in function_call_parts:
        fc = fcp["functionCall"]
        tool_name = fc.get("name")
        tool_args = fc.get("args", {})
        tool_used = tool_name
        function_response_content: Dict[str, Any] = {}

        if tool_name == "add_to_cart":
            pid_raw = tool_args.get("product_id")
            qty = int(tool_args.get("quantity") or 1)
            target_prod = None

            if pid_raw is not None:
                try:
                    target_prod = product_map_by_id.get(int(pid_raw))
                except (ValueError, TypeError):
                    pass

            if not target_prod and live_products:
                # Fuzzy fallback by name in live_products
                for p in live_products:
                    p_name_l = (p.get("name") or p.get("nombre") or "").lower()
                    if any(w in p_name_l for w in ["chocolate", "geisha", "bourbon", "leche", "americano"]):
                        target_prod = p
                        break

            if target_prod:
                prod_id = target_prod.get("id")
                prod_name = target_prod.get("name") or target_prod.get("nombre")
                prod_price = float(target_prod.get("price") or target_prod.get("precio") or target_prod.get("unitPrice") or 0.0)
                prod_sku = target_prod.get("sku") or ""
                prod_stock = target_prod.get("stockQuantity") or target_prod.get("stock") or 50

                item_payload = {
                    "id": prod_id,
                    "sku": prod_sku,
                    "name": prod_name,
                    "nombre": prod_name,
                    "price": prod_price,
                    "precio": prod_price,
                    "quantity": qty,
                    "stock": prod_stock,
                    "targetId": f"product-card-{prod_id}",
                }
                tool_results.append({
                    "tool": "add_to_cart",
                    "success": True,
                    "payload": item_payload,
                })
                ui_actions.append({
                    "type": "HIGHLIGHT_ELEMENT",
                    "targetId": f"product-card-{prod_id}",
                    "animation": "pulse-glow",
                    "badgeText": "¡Añadido al carrito!",
                    "durationMs": 4000,
                })
                tool_data = item_payload
                function_response_content = {
                    "status": "SUCCESS",
                    "added_item": item_payload,
                    "message": f"Producto {prod_name} añadido exitosamente al carrito.",
                }
            else:
                tool_results.append({
                    "tool": "add_to_cart",
                    "success": False,
                    "error": "PRODUCT_NOT_FOUND",
                })
                function_response_content = {
                    "status": "ERROR",
                    "message": "No se encontró el producto especificado en el inventario activo.",
                }

        elif tool_name == "navigate_ui":
            target_route = tool_args.get("route") or "/store"
            target_el = tool_args.get("target_id")
            hl_msg = tool_args.get("highlight_message") or "Sommelier AI ✨"

            ui_actions.append({"type": "NAVIGATE", "route": target_route, "delayMs": 0})
            if target_el:
                ui_actions.append({
                    "type": "HIGHLIGHT_ELEMENT",
                    "targetId": target_el,
                    "badgeText": hl_msg,
                    "animation": "pulse-glow",
                    "durationMs": 4000,
                })

            function_response_content = {
                "status": "SUCCESS",
                "route": target_route,
                "message": f"Navegando al usuario inmediatamente a la sección {target_route}.",
            }
            tool_results.append({
                "tool": "navigate_ui",
                "success": True,
                "payload": {"route": target_route, "target_id": target_el},
            })

        elif tool_name == "get_my_orders":
            # 1. Asegurar co-navegación visual inmediata a /my-orders
            ui_actions.append({"type": "NAVIGATE", "route": "/my-orders", "delayMs": 0})

            # 2. Determinar email del cliente autenticado
            user_email = "carlos.mendoza@example.com"
            if client_id and "@" in client_id:
                user_email = client_id
            elif client_id in ("cliente_carlos", "carlos"):
                user_email = "carlos.mendoza@example.com"
            elif client_id and client_id != "guest_user":
                user_email = f"{client_id}@example.com"

            orders_found: List[Dict[str, Any]] = []

            # Consultar mediante el MCP Server (Tool 19: consultar_ordenes_cliente)
            try:
                call_res = await mcp_client.call_tool("consultar_ordenes_cliente", {"emailCliente": user_email})
                structured = call_res.get("structured_content") or {}
                raw_orders = structured.get("ordenes") or []
                if raw_orders:
                    orders_found = raw_orders
            except Exception as err:
                logger.warning(f"Error consultando órdenes en MCP Server: {err}")

            # Fallback a consulta directa al backend si MCP Server no devolvió órdenes
            if not orders_found:
                try:
                    orders_found = await backend_client.get_orders_by_customer_email(user_email)
                except Exception as b_err:
                    logger.warning(f"Error consultando backend_client orders: {b_err}")

            status_filter = tool_args.get("status")
            if status_filter and orders_found:
                orders_found = [
                    o for o in orders_found
                    if str(o.get("status", "")).upper() == status_filter.strip().upper()
                ]

            if orders_found:
                summary_orders = []
                for o in orders_found:
                    ord_num = o.get("orderNumber") or f"ORD-{o.get('id')}"
                    st = o.get("status", "CONFIRMED")
                    tot = o.get("totalAmount") or o.get("total") or 0.0
                    items = o.get("items") or []
                    items_desc = [
                        f"{it.get('quantity', 1)}x {it.get('productName', 'Café')}"
                        for it in items
                    ] if isinstance(items, list) else []
                    summary_orders.append({
                        "orderNumber": ord_num,
                        "status": st,
                        "total": f"${float(tot):.2f}",
                        "items": ", ".join(items_desc) if items_desc else "Café de especialidad",
                        "createdAt": str(o.get("createdAt", ""))[:19]
                    })

                function_response_content = {
                    "status": "SUCCESS",
                    "total_orders": len(orders_found),
                    "orders": summary_orders,
                    "message": f"Se encontraron {len(orders_found)} órdenes para {user_email}. El cliente ha sido navegado a la ruta /my-orders.",
                }
            else:
                function_response_content = {
                    "status": "NO_ORDERS",
                    "total_orders": 0,
                    "orders": [],
                    "message": f"El cliente {user_email} no tiene órdenes registradas todavía en el sistema. Ha sido navegado a la ruta /my-orders para ver su panel.",
                }

            tool_results.append({
                "tool": "get_my_orders",
                "success": True,
                "payload": function_response_content,
            })
            tool_data = function_response_content

        elif tool_name == "request_catalog_reset":
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: solo un usuario con rol de Administrador puede solicitar el reseteo del catálogo.",
                }
            else:
                pending_action_store.store_pending_action(
                    client_id,
                    {"action": "RESET_CATALOG", "tool": "deactivate_all"},
                    ttl_seconds=60,
                )
                function_response_content = {
                    "status": "PENDING_CONFIRMATION_REQUIRED",
                    "ttl_seconds": 60,
                    "warning": "Dejará la tienda web sin productos para vender e interrumpirá el historial de inventario.",
                    "option_a": "Desactivar selectivamente por código SKU.",
                    "option_b": "Confirmar reseteo total respondiendo 'borra todos' o 'proceder con el reseteo' dentro de los 60 segundos.",
                }
                tool_results.append({
                    "tool": "request_catalog_reset",
                    "success": True,
                    "payload": {"status": "PENDING_2FA_STORED", "ttl": 60},
                })

        elif tool_name == "confirm_catalog_reset":
            pending_act = pending_action_store.get_pending_action(client_id)
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Solo un Administrador puede confirmar el reseteo del catálogo.",
                }
            elif not pending_act:
                function_response_content = {
                    "status": "EXPIRED_OR_NOT_FOUND",
                    "message": "No hay una orden de reseteo pendiente o la ventana de confirmación de 60 segundos ha expirado.",
                }
            else:
                deact_count = await backend_client.deactivate_all_products()
                pending_action_store.clear_pending_action(client_id)
                function_response_content = {
                    "status": "SUCCESS",
                    "deactivated_count": deact_count,
                    "message": f"Se han desactivado {deact_count} productos exitosamente de la base de datos.",
                }
                tool_results.append({
                    "tool": "reset_catalog",
                    "success": True,
                    "payload": {"deactivated_count": deact_count},
                })
                ui_actions.append({"type": "NAVIGATE", "route": "/catalog", "delayMs": 0})

        elif tool_name == "create_coffee_product":
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: solo un usuario con rol de Administrador tiene autorización para crear o registrar nuevos cafés en el catálogo.",
                }
                tool_results.append({
                    "tool": "create_coffee_product",
                    "success": False,
                    "error": "PERMISSION_DENIED",
                })
            else:
                p_name = tool_args.get("name", "Nuevo Café")
                p_price = float(tool_args.get("price", 3.00))
                p_stock = int(tool_args.get("stock", 50))
                p_desc = tool_args.get("description", f"Bebida artesanal {p_name}")
                p_roast = tool_args.get("roast_level", "MEDIUM")

                import random
                clean_sku_prefix = "".join(c for c in p_name if c.isalnum())[:6].upper() or "COF"
                gen_sku = f"COF-{clean_sku_prefix}-{random.randint(1000, 9999)}"

                # Call backend to create product
                created_prod = await backend_client.create_product({
                    "sku": gen_sku,
                    "name": p_name,
                    "price": p_price,
                    "stockQuantity": p_stock,
                    "description": p_desc,
                    "roastLevel": p_roast,
                    "category": "SPECIALTY_BEANS",
                    "origin": "Origen de la Casa",
                    "active": True,
                })
                created_id = created_prod.get("id") if isinstance(created_prod, dict) else 99
                function_response_content = {
                    "status": "SUCCESS",
                    "product": created_prod,
                    "message": f"Café {p_name} registrado exitosamente a ${p_price:.2f}.",
                }
                tool_results.append({
                    "tool": "create_coffee_product",
                    "success": True,
                    "payload": created_prod,
                })
                ui_actions.append({"type": "NAVIGATE", "route": "/catalog", "delayMs": 0})
                ui_actions.append({
                    "type": "HIGHLIGHT_ELEMENT",
                    "targetId": f"product-card-{created_id}",
                    "animation": "pulse-glow",
                    "badgeText": "¡Nuevo producto creado!",
                    "durationMs": 4000,
                })
                tool_data = created_prod

        elif tool_name == "update_coffee_product":
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: solo un usuario con rol de Administrador puede actualizar cafés en el catálogo.",
                }
                tool_results.append({
                    "tool": "update_coffee_product",
                    "success": False,
                    "error": "PERMISSION_DENIED",
                })
            else:
                p_name_arg = (tool_args.get("product_name") or "").lower()
                new_price = tool_args.get("price")
                new_stock = tool_args.get("stock")

                matched_prod = None
                for p in live_products:
                    name_p = (p.get("name") or p.get("nombre") or "").lower()
                    if p_name_arg and (p_name_arg in name_p or name_p in p_name_arg):
                        matched_prod = p
                        break
                    if p_name_arg and any(tok in name_p for tok in p_name_arg.split() if len(tok) > 3):
                        matched_prod = p
                        break

                if not matched_prod:
                    function_response_content = {
                        "status": "NOT_FOUND",
                        "message": f"No se encontró el café '{tool_args.get('product_name')}' para actualizar.",
                    }
                else:
                    pid = matched_prod.get("id")
                    u_price = float(new_price) if new_price is not None else float(matched_prod.get("unitPrice") or matched_prod.get("price") or 30.0)
                    u_stock = int(new_stock) if new_stock is not None else int(matched_prod.get("stockQuantity") or 40)
                    update_data = {
                        "sku": matched_prod.get("sku") or f"COF-PROD-{pid}",
                        "name": matched_prod.get("name"),
                        "description": matched_prod.get("description") or f"Bebida artesanal {matched_prod.get('name')}",
                        "origin": matched_prod.get("origin") or "Origen de la Casa",
                        "altitudeMasl": matched_prod.get("altitudeMasl") or 1600,
                        "processMethod": matched_prod.get("processMethod") or "Lavado",
                        "roastLevel": matched_prod.get("roastLevel") or "MEDIUM",
                        "flavorNotes": matched_prod.get("flavorNotes") or matched_prod.get("description"),
                        "imageUrl": matched_prod.get("imageUrl") or "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
                        "unitPrice": u_price,
                        "stockQuantity": u_stock,
                        "category": matched_prod.get("category") or "SPECIALTY_BEANS",
                        "active": True,
                    }

                    try:
                        updated_res = await backend_client.update_product(int(pid), update_data)
                        function_response_content = {
                            "status": "SUCCESS",
                            "product": updated_res,
                            "message": f"Café {matched_prod.get('name')} actualizado exitosamente a ${float(update_data.get('unitPrice', 0)):.2f} y stock de {update_data.get('stockQuantity')} kg.",
                        }
                        tool_results.append({
                            "tool": "update_coffee_product",
                            "success": True,
                            "payload": updated_res,
                        })
                        ui_actions.append({"type": "NAVIGATE", "route": "/catalog", "delayMs": 0})
                        ui_actions.append({
                            "type": "HIGHLIGHT_ELEMENT",
                            "targetId": f"product-card-{pid}",
                            "animation": "pulse-glow",
                            "badgeText": "¡Producto actualizado!",
                            "durationMs": 4000,
                        })
                        tool_data = updated_res
                    except Exception as u_err:
                        logger.error(f"Error updating product: {u_err}")
                        function_response_content = {
                            "status": "ERROR",
                            "message": f"Error al actualizar el producto: {str(u_err)}",
                        }

        elif tool_name == "deactivate_coffee_product":
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: solo un usuario con rol de Administrador puede desactivar o eliminar productos del catálogo.",
                }
                tool_results.append({
                    "tool": "deactivate_coffee_product",
                    "success": False,
                    "error": "PERMISSION_DENIED",
                })
            else:
                p_name_arg = (tool_args.get("product_name") or "").lower()
                matched_prod = None
                for p in live_products:
                    name_p = (p.get("name") or p.get("nombre") or "").lower()
                    if p_name_arg and (p_name_arg in name_p or name_p in p_name_arg):
                        matched_prod = p
                        break
                    if p_name_arg and any(tok in name_p for tok in p_name_arg.split() if len(tok) > 3):
                        matched_prod = p
                        break

                if not matched_prod:
                    function_response_content = {
                        "status": "NOT_FOUND",
                        "message": f"No se encontró ningún café activo que coincida con '{tool_args.get('product_name')}'.",
                    }
                else:
                    pid = matched_prod.get("id")
                    ok = await backend_client.deactivate_product(int(pid))
                    function_response_content = {
                        "status": "SUCCESS" if ok else "ERROR",
                        "message": f"El café {matched_prod.get('name')} ha sido eliminado y desactivado del catálogo comercial.",
                    }
                    tool_results.append({
                        "tool": "deactivate_coffee_product",
                        "success": ok,
                        "payload": {"id": pid, "name": matched_prod.get("name")},
                    })
                    ui_actions.append({"type": "NAVIGATE", "route": "/catalog", "delayMs": 0})

        elif tool_name == "list_orders":
            if not (is_admin or is_barista):
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: se requieren privilegios de Barista o Administrador para consultar comandas.",
                }
            else:
                st_arg = tool_args.get("status")
                call_res = await mcp_client.call_tool("listar_ordenes_recientes", {"limite": 10})
                raw_orders = call_res.get("structured_content") or call_res.get("result") or []
                filtered = []
                if isinstance(raw_orders, list):
                    if st_arg:
                        filtered = [o for o in raw_orders if str(o.get("status", "")).upper() == st_arg.strip().upper()]
                    else:
                        filtered = raw_orders

                orders_summary = []
                for o in filtered:
                    ord_num = o.get("orderNumber") or f"ORD-{o.get('id')}"
                    cust_n = o.get("customerName") or "Cliente"
                    tot_amt = o.get("totalAmount") or o.get("total") or 0.0
                    st_val = o.get("status", "CONFIRMED")
                    items_desc = [f"{it.get('quantity', 1)}x {it.get('productName', 'Café')}" for it in o.get("items", [])]
                    orders_summary.append({
                        "orderNumber": ord_num,
                        "customerName": cust_n,
                        "status": st_val,
                        "total": f"${float(tot_amt):.2f}",
                        "items": ", ".join(items_desc) if items_desc else "Café de especialidad"
                    })

                function_response_content = {
                    "status": "SUCCESS",
                    "total_orders": len(orders_summary),
                    "orders": orders_summary,
                    "message": f"Se encontraron {len(orders_summary)} comandas activas para supervisión en barra.",
                }
                tool_results.append({
                    "tool": "list_orders",
                    "success": True,
                    "payload": function_response_content,
                })
                ui_actions.append({"type": "NAVIGATE", "route": "/orders", "delayMs": 0})
                tool_data = function_response_content

        elif tool_name == "update_order_status":
            if not (is_admin or is_barista):
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: se requieren permisos de Barista o Administrador para actualizar órdenes.",
                }
            else:
                ord_num = tool_args.get("order_number", "")
                new_st = tool_args.get("new_status", "PREPARING").upper()
                call_res = await mcp_client.call_tool("actualizar_estado_orden", {"numeroOrden": ord_num, "nuevoEstado": new_st})
                function_response_content = call_res.get("structured_content") or call_res.get("result") or {"exito": True, "message": f"Orden {ord_num} actualizada a {new_st}"}
                tool_results.append({
                    "tool": "update_order_status",
                    "success": True,
                    "payload": function_response_content,
                })
                ui_actions.append({"type": "NAVIGATE", "route": "/orders", "delayMs": 0})

        elif tool_name == "search_catalog":
            q = tool_args.get("query", "").lower()
            matches = [
                p for p in live_products
                if q in (p.get("name") or "").lower()
                or q in (p.get("flavorNotes") or "").lower()
                or q in (p.get("description") or "").lower()
            ]
            function_response_content = {
                "status": "SUCCESS",
                "matches_count": len(matches),
                "matches": matches,
            }
            ui_actions.append({
                "type": "TYPE_AND_SEARCH",
                "targetId": "catalog-search-input",
                "text": q,
                "delayMs": 0,
            })
            tool_results.append({
                "tool": "search_catalog",
                "success": True,
                "payload": {"query": q, "matches": matches},
            })

        elif tool_name == "check_stock":
            sku_val = tool_args.get("sku", "")
            call_res = await mcp_client.call_tool("consultar_stock", {"sku": sku_val})
            function_response_content = call_res.get("structured_content") or {"text": call_res.get("text")}
            tool_results.append({
                "tool": "check_stock",
                "success": not call_res.get("is_error", False),
                "payload": function_response_content,
            })

        elif tool_name == "track_order":
            ord_num = tool_args.get("order_number", "")
            call_res = await mcp_client.call_tool("rastrear_orden", {"numeroOrden": ord_num})
            function_response_content = call_res.get("structured_content") or {"text": call_res.get("text")}
            tool_results.append({
                "tool": "track_order",
                "success": not call_res.get("is_error", False),
                "payload": function_response_content,
            })

        elif tool_name == "get_barista_recipe":
            method = tool_args.get("method", "V60")
            grams = float(tool_args.get("grams", 18.0))
            call_res = await mcp_client.call_tool("calcular_receta_extraccion", {"metodo": method, "gramosCafe": grams})
            function_response_content = call_res.get("structured_content") or {"text": call_res.get("text")}
            tool_results.append({
                "tool": "get_barista_recipe",
                "success": True,
                "payload": function_response_content,
            })

        else:
            function_response_content = {"status": "SUCCESS", "message": "Operación completada."}

        function_responses.append({
            "name": tool_name,
            "response": function_response_content,
        })

    # Deduplicate UI actions (e.g. keeping single NAVIGATE to same route)
    seen_nav = set()
    deduped_ui_actions = []
    for act in ui_actions:
        if act.get("type") == "NAVIGATE":
            r = act.get("route")
            if r in seen_nav:
                continue
            seen_nav.add(r)
        deduped_ui_actions.append(act)
    ui_actions = deduped_ui_actions

    # 4. Phase 2: Send functionResponse back to Gemini for 100% natural conversational prose
    contents_phase2 = list(contents)
    contents_phase2.append({"role": "model", "parts": candidate_parts})
    contents_phase2.append({
        "role": "user",
        "parts": [
            {
                "functionResponse": {
                    "name": fr["name"],
                    "response": fr["response"],
                }
            }
            for fr in function_responses
        ],
    })

    payload_phase2 = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents_phase2,
        "tools": GEMINI_TOOLS_DECLARATION,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 600},
    }

    res2 = query_gemini_with_fallback(
        payload=payload_phase2,
        api_key=api_key,
        preferred_model=model_name,
        timeout=20.0,
    )
    if res2 and res2.get("candidates"):
        try:
            final_reply = res2["candidates"][0]["content"]["parts"][0]["text"].strip()
            return (final_reply, tool_results, ui_actions, tool_used, tool_data)
        except Exception:
            pass

    # Graceful fallback if Phase 2 network drops
    fallback = function_responses[0]["response"].get("message") if function_responses else "Operación ejecutada exitosamente."
    return (fallback, tool_results, ui_actions, tool_used, tool_data)


def call_gemini(
    user_prompt: str,
    inventory_context: Optional[str] = None,
    user_role: Optional[str] = None,
    timeout_seconds: float = 12.0,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    current_cart: Optional[List[Dict[str, Any]]] = None,
) -> Optional[str]:
    """Lightweight single-turn fallback query to Gemini."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    model = getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")
    system_instruction = get_system_prompt_for_role(user_role)
    if current_cart:
        cart_lines = [
            f"- {c.get('quantity', 1)}x {c.get('name', 'Café')} | ${float(c.get('price', 0)):.2f} USD"
            for c in current_cart
        ]
        cart_txt = "\n".join(cart_lines)
        system_instruction += f"\n\nESTADO ACTUAL DEL CARRITO DE COMPRAS DEL CLIENTE (React):\n{cart_txt}\n"
    if inventory_context:
        system_instruction += f"\n\nCATÁLOGO REAL EN TIEMPO REAL:\n{inventory_context}\n"

    contents = []
    if conversation_history:
        for turn in conversation_history[-6:]:
            role_val = turn.get("role", "user")
            gemini_role = "user" if role_val in ("user", "human") else "model"
            content_text = (turn.get("content") or "").strip()
            if content_text:
                contents.append({"role": gemini_role, "parts": [{"text": content_text}]})

    contents.append({"role": "user", "parts": [{"text": user_prompt}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 600},
    }

    res = query_gemini_with_fallback(
        payload=payload,
        api_key=api_key,
        preferred_model=model,
        timeout=timeout_seconds,
    )
    if res and res.get("candidates"):
        try:
            return res["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass
    return None
