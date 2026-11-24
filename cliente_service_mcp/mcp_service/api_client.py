"""
Async HTTP API Client for communicating with the Spring Boot Coffee Enterprise Backend.
Includes resilient fallback when backend is in maintenance or offline.
"""

from typing import Any, Dict, List, Optional
import httpx
from mcp_service.config import settings

# Clean production initial state (no mock seed data)
DEFAULT_COFFEE_CATALOG: List[Dict[str, Any]] = []
DEFAULT_ORDERS: List[Dict[str, Any]] = []


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
            import os
            admin_user = os.getenv("ADMIN_USERNAME", "admin")
            admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/auth/login",
                    json={"username": admin_user, "password": admin_pass},
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

    async def get_dashboard_metrics(self) -> Optional[Dict[str, Any]]:
        """Fetch real-time dashboard metrics from Spring Boot backend."""
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(f"{self.base_url}/api/v1/dashboard/metrics", headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass
        return None

    async def get_all_customers(self) -> List[Dict[str, Any]]:
        """Fetch registered customers from Spring Boot backend."""
        token = await self._ensure_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        elif settings.AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {settings.AUTH_TOKEN}"

        try:
            async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/customers",
                    headers=headers,
                    params={"page": 0, "size": 100},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict) and "content" in data:
                        return data["content"]
                    if isinstance(data, list):
                        return data
        except Exception:
            pass
        return []


backend_client = BackendApiClient()
