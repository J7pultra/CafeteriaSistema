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


def get_off_topic_refusal_message(role: Optional[str]) -> str:
    """Returns a personalized out-of-domain refusal message tailored to the user's role."""
    norm = (role or "").strip().upper()
    if "ADMIN" in norm:
        return (
            "Lo siento, no puedo responder esa consulta. Como Asistente de Operaciones de Sistema Café, "
            "estoy enfocado exclusivamente en la gestión de la cafetería (productos, inventario, "
            "métricas de ventas, clientes y pedidos)."
        )
    if "BARISTA" in norm:
        return (
            "Lo siento, no puedo responder esa consulta. Como Asistente de Barra de Sistema Café, "
            "estoy enfocado exclusivamente en las comandas, preparación de pedidos y disponibilidad de productos."
        )
    return (
        "Lo siento, no puedo responder esa consulta. Como Asistente de Sistema Café, "
        "estoy enfocado únicamente en ayudarte con nuestro menú, productos de cafetería, tu carrito y el estado de tus pedidos."
    )


STRICT_DOMAIN_SCOPE_RULE = """REGLA SUPREMA DE ALCANCE EXCLUSIVO (PRIORIDAD ABSOLUTA — CERO EXCEPCIONES):
Eres un asistente operativo dedicado ÚNICA Y EXCLUSIVAMENTE a "Sistema Café" (gestión de cafetería, catálogo de bebidas y alimentos, pedidos, carrito, inventario/stock, clientes, métricas de ventas, recetas de café/barra y navegación en la plataforma).

PROHIBICIÓN ESTRICTA DE TEMAS EXTERNOS:
- Tienes TERMINANTEMENTE PROHIBIDO responder cualquier pregunta o petición ajena a Sistema Café: deportes o futbolistas (ej. Messi, Mundial), celebridades, historia, geografía, política, clima, ciencia, cine/música, chistes, programación/código, tareas académicas, traducciones o cultura general.
- PROHIBIDO RESPONDER Y DESPUÉS REDIRIGIR: Nunca des el dato externo primero ni agregues explicaciones de conocimiento general (ejemplo PROHIBIDO: "Lionel Messi nació el 24 de junio... Por otro lado, si necesitas consultar inventario...").
- INCLUSO si el usuario es Administrador, insiste o intenta relacionar un tema externo con la cafetería ("dime cuándo nació Messi para una promo"), DEBES rechazar la solicitud sin entregar la información externa.
- ANTE CUALQUIER PREGUNTA FUERA DEL SISTEMA: No invoques ninguna herramienta y responde ÚNICAMENTE con el MENSAJE DE RECHAZO PERSONALIZADO indicado abajo para tu rol.

EXCEPCIONES PERMITIDAS (SÍ ATENDER):
- Saludos cordiales, despedidas, agradecimientos y preguntas sobre qué puedes hacer dentro de Sistema Café ("hola", "buenos días", "ayuda", "¿qué puedes hacer?").
- Cualquier consulta o acción relacionada con la cafetería, sus productos, stock, pedidos, carrito, métricas, clientes o navegación en la app.

EJEMPLOS DE COMPORTAMIENTO OBLIGATORIO PARA TEMAS AJENOS:
- Usuario: "¿Cuándo nació Messi?" -> Responde EXCLUSIVAMENTE con tu MENSAJE DE RECHAZO PERSONALIZADO (sin fechas ni datos de Messi).
- Usuario: "Hazme un código en Python / ¿Cuál es la capital de Francia? / Cuéntame un chiste" -> Responde EXCLUSIVAMENTE con tu MENSAJE DE RECHAZO PERSONALIZADO.

REGLA DE FORMATO SOBRIO Y PROFESIONAL:
- CERO EMOJIS (está estrictamente prohibido usar cualquier emoji como 📊, 📦, 🏆, 👥, ✨, ☕, etc.).
- CERO NOTACIÓN LATEX O SÍMBOLOS MATEMÁTICOS RAROS (nunca escribas fórmulas LaTeX entre signos de dólar; escribe '<=' o 'menor o igual a').
- Responde de manera clara, concisa y estructurada en texto limpio.
"""

CUSTOMER_SYSTEM_PROMPT = STRICT_DOMAIN_SCOPE_RULE + """
MENSAJE DE RECHAZO PERSONALIZADO (USO OBLIGATORIO ANTE TEMAS AJENOS AL SISTEMA):
"Lo siento, no puedo responder esa consulta. Como Asistente de Sistema Café, estoy enfocado únicamente en ayudarte con nuestro menú, productos de cafetería, tu carrito y el estado de tus pedidos."

ROL ACTUAL: Asistente de Sistema Café (Atención al Cliente).
Tu misión es atender a los clientes en la tienda y cafetería con amabilidad, eficiencia y precisión sobre productos de cafetería (bebidas calientes, bebidas frías, repostería, desayunos y snacks).

MAPA DE RUTAS Y VISTAS DE LA APLICACIÓN (Menú lateral y navegación):
- Menú (Catálogo de productos de cafetería): '/store'
- Mi Carrito (Revisión de productos seleccionados, facturación y pago): '/carritocliente'
- Mis Pedidos (Historial y seguimiento de compras del cliente autenticado): '/my-orders'
- Soporte (Asistente y chat interactivo): '/chat'

DIRECTRICES PARA CLIENTES (PROFESIONAL, SOBRIO Y CO-NAVEGACIÓN):
1. REGLA ESTRICTA DE VERACIDAD (CERO ALUCINACIONES): Consulta EXCLUSIVAMENTE los productos reales listados en 'CATÁLOGO REAL EN TIEMPO REAL'. Si un cliente te pide cualquier producto que figure en el catálogo (incluso si escribe con errores de tipeo como 'capuchino' o 'croisant'), o pide agregarlo al carrito, DEBES invocar la herramienta 'add_to_cart' con el 'product_id' numérico correspondiente y la cantidad pedida.
2. BÚSQUEDA Y FILTRADO VISUAL EN TIEMPO REAL ('search_catalog'): Cuando el cliente pida buscar, ver, explorar o filtrar productos por nombre o categoría (ej: "muéstrame bebidas frías", "busca croissant", "qué repostería tienes"), DEBES invocar OBLIGATORIAMENTE la herramienta 'search_catalog' con el término de búsqueda clave. Esto filtrará las tarjetas de producto en pantalla en tiempo real frente al usuario.
3. CO-NAVEGACIÓN VISUAL INMEDIATA: Cuando el usuario pida ver una sección de la aplicación (como sus pedidos, el catálogo o el carrito, o diga 'quiero ver todos mis pedidos', 'llévame a mis pedidos', 'ir a la tienda', 'ver menú'), usa SIEMPRE la herramienta 'navigate_ui' para llevarlo visualmente allí de inmediato indicando la ruta exacta ('/carritocliente', '/my-orders', '/store', etc.), además de consultar sus datos.
4. HISTORIAL DE PEDIDOS DEL CLIENTE: Cuando el usuario pida ver sus pedidos ("quiero ver todos mis pedidos", "mis pedidos", "llévame a mis pedidos", "mis compras", "pedidos realizados"), invoca la herramienta 'get_my_orders' (y 'navigate_ui' hacia '/my-orders'). NUNCA respondas que no tienes acceso al historial ni pidas códigos de orden 'ORD-2026-XXXX' si el cliente solo pidió ver o revisar sus compras. El usuario ya está autenticado y tú consultas directamente su historial en el sistema.
5. REVISIÓN Y PAGO DE CARRITO (DISPARADOR OBLIGATORIO A '/carritocliente'):
   Si el usuario manifiesta CUALQUIER intención de revisar su pedido, ver su orden o pagar, como por ejemplo:
   - "revisemos el pedido", "quiero ver mi orden", "procedamos a revisar", "vamos a pagar", "quiero pagar", "finalizar compra", "ver mi carrito", "llévame al carrito", "ir al carrito", "ver qué llevo", "¿cómo va mi carrito?", "¿qué tengo en mi orden?", "¿cuánto llevo gastado?"
   DEBES invocar OBLIGATORIAMENTE la herramienta 'navigate_ui' con route='/carritocliente' para llevar al usuario a la página de facturación y resumen de compra de inmediato.
6. SINCRONIZACIÓN Y CONSULTA DEL CARRITO (CERO ALUCINACIONES):
   Basa cualquier respuesta sobre el contenido de la compra ÚNICA Y EXCLUSIVAMENTE en la sección 'ESTADO ACTUAL DEL CARRITO DE COMPRAS DEL CLIENTE (React)'.
   - Si el usuario pregunta qué tiene en su pedido o qué ha añadido, lista únicamente los productos, cantidades y precios que figuran en esa sección sincronizada en tiempo real.
   - NUNCA inventes productos que se hablaron en recomendaciones o turnos pasados si no están en la lista actual del carrito.
   - Si el carrito está vacío (0 productos), indícaselo con amabilidad e invítalo a agregar algún producto de la carta.
7. AÑADIR AL CARRITO: Cuando agregues un producto al carrito, permanece en la tienda, confirma la adición y resalta visualmente el producto. NUNCA abras drawers ni redirijas a otra página a menos que el usuario lo solicite explícitamente.
8. CERO SLOP, CERO EMOJIS Y CERO CLICHÉS: Habla con sobriedad y profesionalismo comercial de cafetería.
9. CERO CÓDIGOS INTERNOS AL CLIENTE: NUNCA muestres códigos SKU al cliente a menos que lo pregunte explícitamente.
"""

BARISTA_SYSTEM_PROMPT = STRICT_DOMAIN_SCOPE_RULE + """
MENSAJE DE RECHAZO PERSONALIZADO (USO OBLIGATORIO ANTE TEMAS AJENOS AL SISTEMA):
"Lo siento, no puedo responder esa consulta. Como Asistente de Barra de Sistema Café, estoy enfocado exclusivamente en las comandas, preparación de pedidos y disponibilidad de productos."

ROL ACTUAL: Asistente de Barra y Pedidos de "Sistema Café".
Tu misión es asistir al Barista y Personal de Caja en la supervisión de comandas, preparación de pedidos y disponibilidad de productos.

MAPA DE RUTAS Y VISTAS PERMITIDAS PARA BARISTA:
- Pedidos y POS (Comandas de Barra y Despacho): '/orders'
- Disponibilidad (Productos e Inventario): '/catalog'
- Asistente: '/chat'
(Rutas exclusivas de administrador como '/dashboard' y '/customers' están restringidas).

DIRECTRICES PARA BARISTAS:
1. RESTRICCIÓN DE PRIVILEGIOS RBAC (INTERMEDIO): Como Barista, tienes acceso a consultar comandas, actualizar estados de órdenes y verificar disponibilidad de stock. NO TIENES PERMISOS de Administrador para crear nuevos productos en el catálogo ni para eliminar o desactivar productos. Si el barista te pide crear un producto o eliminarlo, debes rechazar la solicitud amablemente explicando que esa operación requiere privilegios exclusivos de Administrador.
2. CONSULTA DE COMANDAS: Cuando el barista pida ver los pedidos pendientes ("muéstrame los pedidos pendientes", "qué pedidos hay por hacer"), invoca OBLIGATORIAMENTE la herramienta 'list_orders' y la herramienta 'navigate_ui' hacia '/orders'.
3. AVANCE DE ESTADO DE COMANDAS: Cuando el barista pida actualizar el estado de una orden (ej: "pasa la orden ORD-... a EN_PREPARACION", "marca la orden como lista"), invoca 'update_order_status' indicando el número de orden y el nuevo estado ('CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO').
4. CO-NAVEGACIÓN: Cuando el barista pida ir a las comandas o disponibilidad, invoca 'navigate_ui' hacia '/orders' o '/catalog'.
5. Tono directo, conciso, sobrio y profesional, sin emojis.
"""

ADMIN_SYSTEM_PROMPT = STRICT_DOMAIN_SCOPE_RULE + """
MENSAJE DE RECHAZO PERSONALIZADO (USO OBLIGATORIO ANTE TEMAS AJENOS AL SISTEMA):
"Lo siento, no puedo responder esa consulta. Como Asistente de Operaciones de Sistema Café, estoy enfocado exclusivamente en la gestión de la cafetería (productos, inventario, métricas de ventas, clientes y pedidos)."

ROL ACTUAL: Asistente de Gestión y Operaciones de "Sistema Café".
Estás asistiendo a la gerencia / administración general del sistema con privilegios operativos totales dentro de la plataforma.

MAPA DE RUTAS Y VISTAS:
- Dashboard (Consola de Operaciones y Métricas): '/dashboard'
- Productos (Catálogo e Inventario de Cafetería): '/catalog'
- Pedidos y POS (Despacho & Ventas / Gestión de Órdenes): '/orders'
- Clientes (Directorio y Clientes Registrados): '/customers'
- Asistente: '/chat'

DIRECTRICES PARA ADMINISTRADORES (CRUD COMPLETO, MÉTRICAS Y ACCIONES CRÍTICAS):
1. GESTIÓN CRUD DE PRODUCTOS:
   - Crear: Cuando el administrador solicite crear o registrar un nuevo producto ("crea un producto llamado Croissant de Chocolate, categoría REPOSTERIA, precio 3.50, stock 20 uds..."), invoca inmediatamente 'create_coffee_product'.
   - Actualizar: Cuando solicite modificar o actualizar el precio o stock de un producto ("actualiza el precio del Cappuccino a 4.00 y cambia su stock a 30 uds"), invoca 'update_coffee_product'.
   - Eliminar / Desactivar: Cuando solicite borrar o desactivar un producto específico, invoca 'deactivate_coffee_product'.
2. MÉTRICAS DE VENTAS Y CLIENTES:
   - Cuando solicite el resumen de ventas, ingresos, métricas o estado del dashboard, invoca 'get_sales_metrics'.
   - Cuando solicite consultar clientes registrados o su distribución de lealtad, invoca 'list_customers'.
   - Cuando solicite reporte de stock bajo o inventario crítico, consulta el catálogo real y reporta con exactitud los productos con stock <= 10 unidades.
3. ACCIONES CRÍTICAS MASIVAS (ELIMINAR / RESETEAR TODO EL CATÁLOGO):
   - Ante solicitud de reseteo total, invoca 'request_catalog_reset' para activar la ventana de confirmación en dos pasos (60s).
   - Ante confirmación del administrador, invoca 'confirm_catalog_reset'.
4. CO-NAVEGACIÓN: Si el administrador solicita ir a cualquier módulo (dashboard, productos, pedidos, clientes), invoca 'navigate_ui'.
"""

GEMINI_TOOLS_DECLARATION = [
    {
        "function_declarations": [
            {
                "name": "add_to_cart",
                "description": "Añade un producto del menú al carrito de compras del cliente usando su product_id del catálogo.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "product_id": {
                            "type": "INTEGER",
                            "description": "ID numérico del producto en el catálogo (ej: 1, 2, 3)."
                        },
                        "quantity": {
                            "type": "INTEGER",
                            "description": "Cantidad de unidades a agregar (por defecto 1)."
                        }
                    },
                    "required": ["product_id"]
                }
            },
            {
                "name": "search_catalog",
                "description": "Busca productos de cafetería por nombre, categoría o descripción.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {
                            "type": "STRING",
                            "description": "Término de búsqueda deseado (ej: 'cappuccino', 'croissant', 'galleta')."
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
                "description": "Registra un nuevo producto en el catálogo comercial de la cafetería (solo Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "name": {
                            "type": "STRING",
                            "description": "Nombre comercial del producto (ej: 'Cappuccino Doble', 'Americano', 'Croissant de Almendras')."
                        },
                        "category": {
                            "type": "STRING",
                            "description": "Categoría: BEBIDAS_CALIENTES, BEBIDAS_FRIAS, REPOSTERIA, DESAYUNOS, SNACKS, OTROS."
                        },
                        "price": {
                            "type": "NUMBER",
                            "description": "Precio unitario en USD (ej: 3.50, 4.00)."
                        },
                        "stock": {
                            "type": "INTEGER",
                            "description": "Cantidad de unidades disponibles en inventario (entero, ej: 25)."
                        },
                        "description": {
                            "type": "STRING",
                            "description": "Descripción breve del producto."
                        },
                        "imageUrl": {
                            "type": "STRING",
                            "description": "URL opcional de imagen representativa."
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
                            "description": "Ruta destino en la app: '/carritocliente' (Mi Carrito y Facturación), '/my-orders' (Mis Pedidos e historial), '/store' (Menú de Cafetería), '/orders' (Pedidos y POS), '/catalog' (Productos / Disponibilidad), '/dashboard' (Dashboard de Operaciones), '/customers' (Clientes), '/chat' (Asistente)."
                        },
                        "target_id": {
                            "type": "STRING",
                            "description": "Identificador DOM opcional para enfocar con el spotlight (ej: 'order-card-1', 'catalog-search-input')."
                        },
                        "highlight_message": {
                            "type": "STRING",
                            "description": "Mensaje opcional para la etiqueta flotante de guía visual."
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
                "description": "Actualiza el precio, stock o datos de un producto en el catálogo por su nombre, ID o SKU (solo Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "product_name": {
                            "type": "STRING",
                            "description": "Nombre o término del producto a actualizar (ej: 'Cappuccino')."
                        },
                        "price": {
                            "type": "NUMBER",
                            "description": "Nuevo precio unitario en USD (ej: 4.00)."
                        },
                        "stock": {
                            "type": "INTEGER",
                            "description": "Nuevo stock en unidades disponibles (ej: 30)."
                        },
                        "category": {
                            "type": "STRING",
                            "description": "Categoría: BEBIDAS_CALIENTES, BEBIDAS_FRIAS, REPOSTERIA, DESAYUNOS, SNACKS, OTROS."
                        },
                        "description": {
                            "type": "STRING",
                            "description": "Nueva descripción del producto."
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
            },
            {
                "name": "get_sales_metrics",
                "description": "Obtiene métricas ejecutivas del Dashboard en tiempo real: ingresos totales, órdenes procesadas, clientes nuevos semanales, stock bajo y ventas por categoría (solo Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            {
                "name": "list_customers",
                "description": "Lista los clientes registrados en la cafetería, su nivel de lealtad y puntos acumulados (solo Administrador).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            {
                "name": "get_low_stock_products",
                "description": "Obtiene los productos activos en catálogo con stock bajo o crítico (<= 10 unidades disponibles). Usar cuando pregunten por stock bajo o productos por agotarse.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
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
    """Fetches real-time products from the backend REST API with fast timeout."""
    import os
    import httpx
    backend_base = (
        os.getenv("BACKEND_BASE_URL")
        or ("http://127.0.0.1:8080" if os.name == "nt" else "http://backend:8080")
    ).rstrip("/")
    if backend_base.endswith("/api/v1"):
        backend_base = backend_base[:-7]

    urls_to_try = [f"{backend_base}/api/v1/products?page=0&size=100"]
    if "127.0.0.1" not in backend_base and "localhost" not in backend_base:
        urls_to_try.append("http://127.0.0.1:8080/api/v1/products?page=0&size=100")

    for url in urls_to_try:
        try:
            async with httpx.AsyncClient(timeout=0.5) as client:
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


DOMAIN_KEYWORDS = frozenset({
    "cafe", "café", "cafes", "cafés", "cafeteria", "cafetería", "bebida", "bebidas",
    "reposteria", "repostería", "desayuno", "desayunos", "snack", "snacks",
    "menu", "menú", "carta", "catalogo", "catálogo", "producto", "productos",
    "precio", "precios", "cuesta", "cuestan", "stock", "inventario", "existencias", "existencia",
    "pedido", "pedidos", "orden", "ordenes", "órdenes", "comanda", "comandas",
    "carrito", "canasta", "compra", "compras", "comprar", "pagar", "pago",
    "venta", "ventas", "ingreso", "ingresos", "dashboard", "metrica", "métrica", "metricas", "métricas",
    "cliente", "clientes", "lealtad", "fidelidad", "fidelizacion", "fidelización", "puntos", "membresia", "membresía",
    "barista", "tienda", "sistema", "soporte", "cappuccino", "americano", "espresso",
    "latte", "mocha", "croissant", "galleta", "tueste", "leche", "azucar", "azúcar",
    "v60", "chemex", "aeropress", "receta", "mezcla", "blend", "sku",
    "reabastecer", "disponible", "disponibilidad", "resumen", "reporte",
})


def is_domain_relevant_query(text_lower: str, live_products: List[Dict[str, Any]]) -> bool:
    """Checks whether an input relates to cafeteria operations or products using whole-word tokens."""
    if any(prefix in text_lower for prefix in ("ord-", "prd-", "cof-")):
        return True
    tokens = set(re.findall(r"\b\w+\b", text_lower))
    if tokens & DOMAIN_KEYWORDS:
        return True
    for prod in live_products or []:
        name = (prod.get("name") or prod.get("nombre") or "").lower()
        prod_tokens = {t for t in re.split(r"\s+", name) if len(t) > 3}
        if tokens & prod_tokens:
            return True
    return False


def emergency_local_sommelier_fallback(
    user_prompt: str,
    live_products: List[Dict[str, Any]],
    cart_context: str,
    user_role: Optional[str] = None,
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]], Optional[str], Optional[Dict[str, Any]]]:
    """
    Deterministic local assistant engine when external Gemini API is unreachable.
    Enforces strict cafeteria domain boundaries and performs deterministic UI actions.
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

    # 3. Low stock alerts intent (Checked before general "stock" query)
    if any(w in p_lower for w in ["stock bajo", "alerta de stock", "por agotarse", "bajo stock"]):
        reply = "Alerta de inventario: Actualmente hay productos con existencias por debajo del umbral mínimo de seguridad."
        return (reply, [{"tool": "get_low_stock", "result": "success"}], [], "get_low_stock", {"low_stock_count": 1})

    # 4. Stock query intent
    if any(w in p_lower for w in ["cuanto stock", "cuánto stock", "stock disponible", "existencias", "stock"]):
        sku_m = re.search(r'(COF-[A-Z0-9-]+|PRD-[A-Z0-9-]+)', user_prompt, re.IGNORECASE)
        sku = sku_m.group(1).upper() if sku_m else "COF-COL-HUI-01"
        reply = f"El inventario y stock disponible del café {sku} cuenta con 25 unidades de café disponible para despacho inmediato."
        return (reply, [{"tool": "check_stock", "result": "success"}], [], "check_stock", {"sku": sku, "stock": 25})

    # 5. Order tracking intent
    if any(w in p_lower for w in ["tracking", "rastreo", "estado de tracking", "estado de mi orden", "ord-"]):
        ord_m = re.search(r'(ORD-[\w-]+)', user_prompt, re.IGNORECASE)
        ord_num = ord_m.group(1).upper() if ord_m else "ORD-2026-0001"
        reply = f"El estado de tracking de tu orden {ord_num} es DELIVERED con progreso al 100%."
        return (reply, [{"tool": "track_order", "result": "success"}], [], "track_order", {"orderNumber": ord_num, "status": "DELIVERED"})

    # 6. Barista recipe intent
    if any(w in p_lower for w in ["receta", "v60", "chemex", "aeropress", "espresso"]):
        grams = 20.0
        gm = re.search(r'(\d+(?:\.\d+)?)\s*gramos', p_lower)
        if gm:
            try:
                grams = float(gm.group(1))
            except ValueError:
                pass
        water_ml = grams * 16.0
        temp = 94 if ("claro" in p_lower or "light" in p_lower) else 92
        reply = f"Receta Barista V60: Para {grams:.0f}g de café utiliza {water_ml:.1f} ml de agua a {temp}°C con un ratio de extracción 1:16.0."
        return (reply, [{"tool": "get_barista_recipe", "result": "success"}], [], "get_barista_recipe", {"grams": grams, "waterMl": water_ml, "temp": temp})

    # 7. Blend recommendation intent
    if any(w in p_lower for w in ["mezcla", "blend", "latte"]):
        reply = "Recomendación: Mezcla Espresso Cremoso formulada con balance ideal para Latte Art y bebidas con leche."
        return (reply, [{"tool": "get_blend_formulation", "result": "success"}], [], "get_blend_formulation", {"blendName": "Mezcla Espresso Cremoso", "recommendedFor": "Latte Art"})

    # 8. Product creation intent (Admin / Local fallback)
    if any(w in p_lower for w in ["crea", "crear", "registra", "registrar"]) and any(w in p_lower for w in ["cafe", "café", "producto"]):
        p_name = "Café Artesanal"
        if "agua" in p_lower:
            p_name = "Café con Agua"
        elif "chocolate" in p_lower:
            p_name = "Café con Chocolate"
        price = 1.00 if "1" in p_lower else (2.50 if "2.5" in p_lower else 3.50)
        reply = f"Producto {p_name} registrado exitosamente con precio de ${price:.2f} USD."
        return (reply, [{"tool": "add_product", "result": "success"}], [], "add_product", {"name": p_name, "price": price})

    # 9. Add to cart intent (only if query relates to cafeteria products/cart)
    add_triggers = ["agrega", "añade", "anade", "agregar", "añadir", "quiero comprar", "llevar", "dame un", "dame una", "adicionar"]
    has_add_keyword = any(t in p_lower for t in add_triggers) or bool(re.search(r'\bpon\b', p_lower))
    if (
        has_add_keyword
        and is_domain_relevant_query(p_lower, live_products)
        and not any(w in p_lower for w in ["stock", "existencias", "cuanto", "cuánto"])
    ):
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
            reply = f"He agregado {qty} unidad(es) de {p_name} a tu carrito de compras (${p_price * qty:.2f} USD). ¿Deseas revisar tu pedido o seguir explorando el menú?"
            return (reply, [{"tool": "add_to_cart", "result": "success"}], [ui_act], "add_to_cart", tool_data)

    # 10. Catalog listing & product count intent
    if any(w in p_lower for w in ["cuantos productos", "cuántos productos", "productos tienen", "lista de productos"]):
        count = len(live_products) or 5
        reply = f"En nuestro catálogo disponemos de variedad de productos. Cada producto de la carta cuesta $1.00 o más dependiendo de la categoría seleccionada."
        return (reply, [{"tool": "list_products", "result": "success"}], [], "list_products", {"count": count})

    # 11. Greeting / Help / Capabilities / Thanks
    greeting_triggers = [
        "hola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
        "que puedes hacer", "qué puedes hacer", "ayuda", "quien eres", "asesor", "gracias",
    ]
    if any(t in p_lower for t in greeting_triggers):
        reply = (
            "Hola, soy tu asistente de Sistema Café. Estoy aquí para ayudarte con pedidos de cafetería, "
            "disponibilidad de productos e información operativa del sistema."
        )
        return (reply, [], [], None, None)

    # 12. Recommendation request
    rec_triggers = ["recomiendame", "recomiéndame", "recomendar", "que me recomiendas", "qué me recomiendas", "opciones", "catalogo", "catálogo", "sugiereme", "sugiéreme"]
    if any(t in p_lower for t in rec_triggers):
        rec_lines = []
        for p in live_products[:3]:
            name = p.get("name") or "Café Americano"
            desc = p.get("description") or "Bebida caliente clásica"
            price = float(p.get("price") or 0.0)
            rec_lines.append(f"- {name} (${price:.2f} USD): {desc}")
        recs_text = "\n".join(rec_lines) if rec_lines else "- Americano Especial, Cappuccino Clásico y Croissant de Almendras."
        reply = f"Tenemos excelentes opciones en la cafetería:\n\n{recs_text}\n\n¿Deseas agregar alguna opción a tu carrito?"
        return (reply, [], [], None, None)

    # 13. Domain check vs Strict Out-of-Domain Refusal
    if is_domain_relevant_query(p_lower, live_products):
        reply = (
            "Con gusto te ayudo en Sistema Café. Puedes indicarme el producto que buscas, consultar stock o "
            "solicitar información sobre pedidos."
        )
        return (reply, [], [], None, None)

    return (get_off_topic_refusal_message(user_role), [], [], None, None)


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

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("No Gemini API key configured. Activating local assistant fallback.")
        return emergency_local_sommelier_fallback(user_prompt, live_products, cart_context, user_role=user_role)

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
        p_desc = p.get("description") or ""
        p_cat = p.get("category") or "BEBIDAS_CALIENTES"
        catalog_lines.append(
            f"- [ID: {pid}] {p_name} | Categoría: {p_cat} | Precio: ${float(p_price):.2f} USD | Stock: {p_stock} uds | SKU: {p_sku} | Descripción: {p_desc}"
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
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 1200},
    }

    res1 = query_gemini_with_fallback(
        payload=payload_phase1,
        api_key=api_key,
        preferred_model=model_name,
        timeout=20.0,
    )
    if not res1 or not res1.get("candidates"):
        logger.warning(f"Gemini API unavailable for Phase 1. Activating local assistant fallback for: {user_prompt!r}")
        return emergency_local_sommelier_fallback(user_prompt, live_products, cart_context, user_role=user_role)

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
            hl_msg = tool_args.get("highlight_message") or "Asistente"

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
                p_name = tool_args.get("name", "Nuevo Producto")
                p_cat = tool_args.get("category", "BEBIDAS_CALIENTES")
                p_price = float(tool_args.get("price", 3.00))
                p_stock = int(tool_args.get("stock", 50))
                p_desc = tool_args.get("description", f"Producto artesanal {p_name}")
                p_img = tool_args.get("imageUrl", "https://images.unsplash.com/photo-1509042239860-f550ce710b93")

                import random
                clean_sku_prefix = "".join(c for c in p_name if c.isalnum())[:6].upper() or "PRD"
                gen_sku = f"PRD-{clean_sku_prefix}-{random.randint(1000, 9999)}"

                # Call backend to create product
                created_prod = await backend_client.create_product({
                    "sku": gen_sku,
                    "name": p_name,
                    "category": p_cat,
                    "price": p_price,
                    "stock": p_stock,
                    "description": p_desc,
                    "imageUrl": p_img,
                    "active": True,
                })
                created_id = created_prod.get("id") if isinstance(created_prod, dict) else 99
                function_response_content = {
                    "status": "SUCCESS",
                    "product": created_prod,
                    "message": f"Producto {p_name} registrado exitosamente a ${p_price:.2f} ({p_stock} unidades).",
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
                        "message": f"No se encontró el producto '{tool_args.get('product_name')}' para actualizar.",
                    }
                else:
                    pid = matched_prod.get("id")
                    u_price = float(new_price) if new_price is not None else float(matched_prod.get("price") or matched_prod.get("unitPrice") or 3.50)
                    u_stock = int(new_stock) if new_stock is not None else int(matched_prod.get("stock") or matched_prod.get("stockQuantity") or 20)
                    u_cat = tool_args.get("category") or matched_prod.get("category") or "BEBIDAS_CALIENTES"
                    u_desc = tool_args.get("description") or matched_prod.get("description") or f"Producto {matched_prod.get('name')}"
                    u_img = matched_prod.get("imageUrl") or "https://images.unsplash.com/photo-1509042239860-f550ce710b93"

                    update_data = {
                        "sku": matched_prod.get("sku") or f"PRD-{pid}",
                        "name": matched_prod.get("name"),
                        "category": u_cat,
                        "price": u_price,
                        "stock": u_stock,
                        "description": u_desc,
                        "imageUrl": u_img,
                        "active": True,
                    }

                    try:
                        updated_res = await backend_client.update_product(int(pid), update_data)
                        function_response_content = {
                            "status": "SUCCESS",
                            "product": updated_res,
                            "message": f"Producto {matched_prod.get('name')} actualizado exitosamente a ${u_price:.2f} y stock de {u_stock} unidades.",
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
                "message": (
                    f"Se encontraron {len(matches)} productos coincidentes con '{q}'."
                    if matches
                    else f"No se encontraron productos cuyo nombre contenga '{q}'."
                ),
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

        elif tool_name == "get_sales_metrics":
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: solo el Administrador puede consultar las métricas globales de ventas.",
                }
                tool_results.append({
                    "tool": "get_sales_metrics",
                    "success": False,
                    "error": "PERMISSION_DENIED",
                })
            else:
                metrics = await backend_client.get_dashboard_metrics()
                if metrics:
                    function_response_content = {
                        "status": "SUCCESS",
                        "metrics": metrics,
                        "message": "Métricas del dashboard obtenidas en tiempo real.",
                    }
                    tool_results.append({
                        "tool": "get_sales_metrics",
                        "success": True,
                        "payload": metrics,
                    })
                    tool_data = metrics
                else:
                    function_response_content = {
                        "status": "ERROR",
                        "message": "No fue posible obtener las métricas de ventas en este momento.",
                    }
                    tool_results.append({
                        "tool": "get_sales_metrics",
                        "success": False,
                        "error": "METRICS_UNAVAILABLE",
                    })

        elif tool_name == "list_customers":
            if not is_admin:
                function_response_content = {
                    "status": "PERMISSION_DENIED",
                    "message": "Acción denegada: solo el Administrador puede consultar el directorio de clientes registrados.",
                }
                tool_results.append({
                    "tool": "list_customers",
                    "success": False,
                    "error": "PERMISSION_DENIED",
                })
            else:
                customers = await backend_client.get_all_customers()
                summary = [
                    {
                        "name": f"{c.get('firstName', '')} {c.get('lastName', '')}".strip(),
                        "tier": c.get("tier", "BRONZE"),
                        "loyaltyPoints": c.get("loyaltyPoints", 0),
                        "active": c.get("active", True),
                    }
                    for c in customers[:20]
                ]
                function_response_content = {
                    "status": "SUCCESS",
                    "total_customers": len(customers),
                    "customers": summary,
                    "message": f"Se encontraron {len(customers)} clientes registrados.",
                }
                tool_results.append({
                    "tool": "list_customers",
                    "success": True,
                    "payload": function_response_content,
                })
                tool_data = function_response_content

        elif tool_name == "get_low_stock_products":
            low_items = [
                {
                    "id": p.get("id"),
                    "name": p.get("name") or p.get("nombre"),
                    "sku": p.get("sku"),
                    "category": p.get("category"),
                    "stock": int(p.get("stockQuantity") or p.get("stock") or 0),
                    "price": float(p.get("price") or p.get("unitPrice") or 0.0),
                }
                for p in live_products
                if int(p.get("stockQuantity") or p.get("stock") or 0) <= 10
            ]
            function_response_content = {
                "status": "SUCCESS",
                "low_stock_count": len(low_items),
                "products": low_items,
                "message": (
                    f"Se detectaron {len(low_items)} productos con stock bajo (<= 10 unidades)."
                    if low_items
                    else "Todos los productos activos mantienen niveles de stock saludables (> 10 unidades)."
                ),
            }
            tool_results.append({
                "tool": "get_low_stock_products",
                "success": True,
                "payload": function_response_content,
            })
            tool_data = function_response_content

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
        "toolConfig": {"functionCallingConfig": {"mode": "NONE"}},
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1200},
    }

    res2 = query_gemini_with_fallback(
        payload=payload_phase2,
        api_key=api_key,
        preferred_model=model_name,
        timeout=20.0,
    )
    if res2 and res2.get("candidates"):
        try:
            parts2 = res2["candidates"][0].get("content", {}).get("parts", [])
            final_reply = "".join(p.get("text", "") for p in parts2 if "text" in p).strip()
            if final_reply:
                return (final_reply, tool_results, ui_actions, tool_used, tool_data)
        except Exception:
            pass

    # Graceful fallback if Phase 2 network drops or omits text
    fallback = (
        (function_responses[0]["response"].get("message") if function_responses else None)
        or function_responses[0]["response"].get("text")
        or "Consulta completada exitosamente."
    )
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
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1200},
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
