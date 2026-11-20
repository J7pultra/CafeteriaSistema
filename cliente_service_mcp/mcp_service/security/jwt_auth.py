"""
JWT Authentication & RBAC Verification for Coffee Enterprise MCP Client.
Zero-Trust Architecture:
- Never trust 'role' or 'clientId' supplied in request body.
- Cryptographically verify the Bearer JWT token against the shared JWT_SECRET.
- Extract client_id (sub) and roles strictly from verified token claims.
"""

import base64
import logging
import os
from typing import Any, Dict, List, Optional, Tuple
import jwt

logger = logging.getLogger("mcp-jwt-auth")

# Secret key matching Spring Boot coffee-backend
RAW_JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "c2VjdXJlX2hlYXJ0X29mX2NvZmZlZV9lbnRlcnByaXNlXzUxMmtleV9zdXByZW1lXzIwMjY="
)


def get_jwt_signing_key() -> bytes:
    """
    Decodes base64-encoded secret if valid, otherwise falls back to UTF-8 bytes.
    Spring Boot io.jsonwebtoken uses Decoders.BASE64.decode(secret).
    """
    try:
        decoded = base64.b64decode(RAW_JWT_SECRET)
        if len(decoded) >= 32:
            return decoded
    except Exception:
        pass
    return RAW_JWT_SECRET.encode("utf-8")


def normalize_role(roles_claim: Any) -> str:
    """
    Normalizes roles array or string into primary application role:
    ROLE_ADMIN, ROLE_BARISTA, or ROLE_CUSTOMER.
    """
    if not roles_claim:
        return "ROLE_CUSTOMER"

    roles_list: List[str] = []
    if isinstance(roles_claim, str):
        roles_list = [roles_claim]
    elif isinstance(roles_claim, (list, tuple, set)):
        roles_list = [str(r) for r in roles_claim]

    # Check hierarchy: ADMIN > BARISTA > CUSTOMER
    for r in roles_list:
        up = r.upper()
        if "ADMIN" in up:
            return "ROLE_ADMIN"
    for r in roles_list:
        up = r.upper()
        if "BARISTA" in up:
            return "ROLE_BARISTA"

    return "ROLE_CUSTOMER"


def verify_and_extract_identity(auth_header: Optional[str]) -> Tuple[str, str, Dict[str, Any]]:
    """
    Validates the Authorization Bearer header.
    Returns (client_id, user_role, claims).
    If no header is provided, returns default guest identity safely.
    If header is present but token signature is invalid, raises ValueError.
    """
    if not auth_header or not auth_header.strip():
        logger.debug("No Authorization header provided. Defaulting to guest_user / ROLE_CUSTOMER.")
        return "guest_user", "ROLE_CUSTOMER", {}

    parts = auth_header.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning("Malformed Authorization header: %s", auth_header[:25])
        return "guest_user", "ROLE_CUSTOMER", {}

    token = parts[1].strip()
    signing_key = get_jwt_signing_key()

    try:
        # Decode and verify HS256 signature
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["HS256"],
            options={"verify_exp": True, "verify_signature": True}
        )
        client_id = payload.get("sub") or payload.get("username") or "authenticated_user"
        roles_claim = payload.get("roles") or payload.get("role") or payload.get("authorities")
        user_role = normalize_role(roles_claim)
        logger.info("JWT verified successfully for user=%s, role=%s", client_id, user_role)
        return client_id, user_role, payload
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token provided.")
        raise ValueError("El token de sesión ha expirado. Por favor, inicia sesión nuevamente.")
    except jwt.InvalidTokenError as exc:
        logger.warning("Invalid JWT signature or format: %s", exc)
        raise ValueError("Token de autenticación no válido.")
