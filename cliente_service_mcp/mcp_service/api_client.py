"""
Async HTTP API Client for communicating with the Spring Boot Coffee Enterprise Backend.
Includes resilient fallback when backend is in maintenance or offline.
"""

from typing import Any, Dict, List, Optional
import httpx
from mcp_service.config import settings

# High-fidelity mock coffee catalog for offline resilience
DEFAULT_COFFEE_CATALOG: List[Dict[str, Any]] = [
    {
        "id": 1,
        "sku": "COF-COL-HUI-01",
        "name": "Café Geisha Huila Reserva Especial",
        "description": "Café de especialidad de origen Huila con notas florales a jazmín, miel de azahar y bergamota.",
        "category": "SPECIALTY",
        "roastLevel": "LIGHT",
        "origin": "Huila, Colombia (1850 msnm, Proceso Lavado)",
        "tastingNotes": "Jazmín, miel, cítrico suave, bergamota, té blanco",
        "price": 18.50,
        "stockQuantity": 35,
        "minStockThreshold": 10,
        "active": True,
    },
    {
        "id": 2,
        "sku": "COF-COL-NAR-02",
        "name": "Café Nariño Volcánico Dulce",
        "description": "Café de altura cultivado en faldas volcánicas con alta acidez brillante y dulzor a caramelo.",
        "category": "SINGLE_ORIGIN",
        "roastLevel": "MEDIUM",
        "origin": "Nariño, Colombia (2100 msnm, Proceso Honey)",
        "tastingNotes": "Caramelo, chocolate negro, manzana roja, panela",
        "price": 14.00,
        "stockQuantity": 8,
        "minStockThreshold": 10,
        "active": True,
    },
    {
        "id": 3,
        "sku": "COF-ETH-YIR-03",
        "name": "Etiopía Yirgacheffe Grano Sagrado",
        "description": "Variedad heredada etíope con cuerpo sedoso, acidez cítrica viva y notas a arándanos.",
        "category": "SPECIALTY",
        "roastLevel": "LIGHT",
        "origin": "Yirgacheffe, Etiopía (1900 msnm, Proceso Natural)",
        "tastingNotes": "Arándanos, lavanda, melocotón, limón meyer",
        "price": 22.00,
        "stockQuantity": 4,
        "minStockThreshold": 10,
        "active": True,
    },
    {
        "id": 4,
        "sku": "COF-BLN-BAR-04",
        "name": "Blend Espresso Casa Barista",
        "description": "Mezcla insignia de granos Colombia y Brasil formulada para crema densa y persistente.",
        "category": "BLEND",
        "roastLevel": "DARK",
        "origin": "Blend Colombia & Minas Gerais Brasil (Lavado/Natural)",
        "tastingNotes": "Cacao amargo, nueces tostadas, melaza, especias",
        "price": 12.50,
        "stockQuantity": 60,
        "minStockThreshold": 15,
        "active": True,
    },
    {
        "id": 5,
        "sku": "COF-DEC-SWP-05",
        "name": "Café Descafeinado Swiss Water",
        "description": "Descafeinado 100% natural mediante proceso Swiss Water sin solventes químicos.",
        "category": "DECAF",
        "roastLevel": "MEDIUM",
        "origin": "Antioquia, Colombia (1600 msnm, Proceso Swiss Water)",
        "tastingNotes": "Vainilla, almendras tostadas, chocolate con leche",
        "price": 15.00,
        "stockQuantity": 18,
        "minStockThreshold": 8,
        "active": True,
    },
]

DEFAULT_ORDERS: List[Dict[str, Any]] = [
    {
        "id": 101,
        "orderNumber": "ORD-2026-0001",
        "customerEmail": "carlos.mendoza@email.com",
        "customerName": "Carlos Mendoza",
        "status": "DELIVERED",
        "totalAmount": 37.00,
        "paymentMethod": "CREDIT_CARD",
        "createdAt": "2026-11-15T09:30:00",
        "items": [
            {"productSku": "COF-COL-HUI-01", "productName": "Café Geisha Huila", "quantity": 2, "unitPrice": 18.50}
        ],
    },
    {
        "id": 102,
        "orderNumber": "ORD-2026-0002",
        "customerEmail": "valentina.gomez@email.com",
        "customerName": "Valentina Gómez",
        "status": "PREPARING",
        "totalAmount": 22.00,
        "paymentMethod": "TRANSFER",
        "createdAt": "2026-11-17T11:15:00",
        "items": [
            {"productSku": "COF-ETH-YIR-03", "productName": "Etiopía Yirgacheffe", "quantity": 1, "unitPrice": 22.00}
        ],
    },
]


class BackendApiClient:
    """Client for Spring Boot REST API with offline resilience and JWT auth."""

    def __init__(self, base_url: Optional[str] = None):
        import os
        raw_url = (
            base_url
            or os.getenv("BACKEND_BASE_URL")
            or os.getenv("BACKEND_API_BASE_URL")
            or settings.BACKEND_BASE_URL
        )
        clean = (raw_url or "http://backend:8080").rstrip("/")
        if clean.endswith("/api/v1"):
            clean = clean[:-7]
        self.base_url = clean
        self.token: Optional[str] = None
        self.headers = {"Content-Type": "application/json"}
        if settings.AUTH_TOKEN:
            self.headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

    async def _ensure_token(self) -> Optional[str]:
        if self.token:
            return self.token
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/auth/login",
                    json={"username": "admin", "password": "admin123"},
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    self.token = data.get("accessToken")
                    return self.token
        except Exception:
            pass
        return None

    async def get_all_products(self) -> List[Dict[str, Any]]:
        """Fetch all products from backend or fallback."""
        url = f"{self.base_url}/api/v1/products"
        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(url, headers=self.headers, params={"page": 0, "size": 100})
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict) and "content" in data:
                        return data["content"]
                    if isinstance(data, list):
                        return data
        except Exception:
            pass

        if settings.ENABLE_MOCK_FALLBACK:
            return DEFAULT_COFFEE_CATALOG
        return []

    async def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new coffee product in the backend."""
        url = f"{self.base_url}/api/v1/products"
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.post(url, json=product_data, headers=headers)
                if resp.status_code in (200, 201):
                    return resp.json()
        except Exception:
            pass

        if settings.ENABLE_MOCK_FALLBACK:
            mock_created = dict(product_data)
            mock_created["id"] = 999
            return mock_created

        raise RuntimeError("No se pudo conectar con el backend para registrar el producto.")

    async def get_product_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        """Find product by SKU."""
        clean_sku = sku.strip().upper()
        url = f"{self.base_url}/api/v1/products/sku/{clean_sku}"
        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(url, headers=self.headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass

        if settings.ENABLE_MOCK_FALLBACK:
            for p in DEFAULT_COFFEE_CATALOG:
                if p["sku"].upper() == clean_sku:
                    return p
        return None

    async def get_order_by_number(self, order_number: str) -> Optional[Dict[str, Any]]:
        """Find order by order number."""
        clean_num = order_number.strip().upper()
        url = f"{self.base_url}/api/v1/orders/number/{clean_num}"
        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(url, headers=self.headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass

        if settings.ENABLE_MOCK_FALLBACK:
            for ord_item in DEFAULT_ORDERS:
                if ord_item["orderNumber"].upper() == clean_num:
                    return ord_item
        return None

    async def get_orders_by_customer_email(self, email: str) -> List[Dict[str, Any]]:
        """Find customer orders by email from Spring Boot backend with fallback."""
        clean_email = email.strip().lower()
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        # 1. Try to query /api/v1/customers/email/{email}
        cust_id = None
        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(f"{self.base_url}/api/v1/customers/email/{clean_email}", headers=headers)
                if resp.status_code == 200:
                    cust_data = resp.json()
                    cust_id = cust_data.get("id")
        except Exception:
            pass

        # 2. If customer ID found, get orders for customer
        if cust_id:
            try:
                async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                    resp = await client.get(f"{self.base_url}/api/v1/orders/customer/{cust_id}", headers=headers, params={"page": 0, "size": 50})
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("content") if isinstance(data, dict) and "content" in data else data
                        if isinstance(items, list):
                            return items
            except Exception:
                pass

        # 3. Fallback: Query all orders and filter by email
        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(f"{self.base_url}/api/v1/orders", headers=headers, params={"page": 0, "size": 100})
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("content") if isinstance(data, dict) and "content" in data else data
                    if isinstance(items, list):
                        matching = [
                            o for o in items
                            if str(o.get("customerEmail", "")).lower() == clean_email
                            or clean_email in str(o.get("customerEmail", "")).lower()
                        ]
                        if matching:
                            return matching
        except Exception:
            pass

        if settings.ENABLE_MOCK_FALLBACK:
            return [o for o in DEFAULT_ORDERS if o["customerEmail"].lower() == clean_email]
        return []

    async def update_product(self, product_id: int, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a product in the backend."""
        url = f"{self.base_url}/api/v1/products/{product_id}"
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            resp = await client.put(url, json=product_data, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            raise RuntimeError(f"Error HTTP {resp.status_code} actualizando producto: {resp.text}")

    async def deactivate_product(self, product_id: int) -> bool:
        """Deactivate a product in the backend."""
        url = f"{self.base_url}/api/v1/products/{product_id}"
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            resp = await client.delete(url, headers=headers)
            return resp.status_code in (200, 204)

    async def deactivate_all_products(self) -> int:
        """Deactivate all active products from backend database for catalog reset."""
        products = await self.get_all_products()
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        deactivated_count = 0
        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            for p in products:
                pid = p.get("id")
                if pid:
                    try:
                        resp = await client.delete(f"{self.base_url}/api/v1/products/{pid}", headers=headers)
                        if resp.status_code in (200, 204):
                            deactivated_count += 1
                    except Exception:
                        pass
        return deactivated_count


backend_client = BackendApiClient()
