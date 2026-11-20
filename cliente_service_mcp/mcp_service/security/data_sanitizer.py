"""
Data Sanitizer & DLP (Data Loss Prevention) Guardrail.
Masks sensitive credentials, PII, tokens, and internal database connection strings.
"""

import re
from typing import Any, Dict, List, Union


class DataSanitizer:
    """Sanitizes text and structured dictionaries against data leakage."""

    # Credit card regex (Visa, MC, Amex, Discover, etc.)
    CC_PATTERN = re.compile(
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b"
    )
    CC_FORMATTED = re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b")

    # JWT Token pattern (header.payload.signature)
    JWT_PATTERN = re.compile(r"\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b")

    # BCrypt hash pattern
    BCRYPT_PATTERN = re.compile(r"\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}")

    # Database URL / Connection String
    DB_URL_PATTERN = re.compile(
        r"(jdbc:)?(postgresql|mysql|mongodb|redis|oracle)://[a-zA-Z0-9_-]+:[^@\s]+@[a-zA-Z0-9.-]+:[0-9]+/[a-zA-Z0-9_-]+",
        re.IGNORECASE,
    )

    # Generic secret assignment
    SECRET_KEY_PATTERN = re.compile(
        r"(api[_-]?key|secret|password|passwd|auth[_-]?token)\s*[:=]\s*['\"]?([a-zA-Z0-9!@#$%^&*()_+=-]{6,})['\"]?",
        re.IGNORECASE,
    )

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Sanitizes sensitive information in a string."""
        if not text:
            return ""

        # Redact JWT tokens
        sanitized = cls.JWT_PATTERN.sub("[REDACTED_JWT_TOKEN]", text)

        # Redact BCrypt hashes
        sanitized = cls.BCRYPT_PATTERN.sub("[REDACTED_PASSWORD_HASH]", sanitized)

        # Redact Database Connection Strings
        sanitized = cls.DB_URL_PATTERN.sub(r"\2://[REDACTED_DB_CREDENTIALS]@[HOST]/[DB]", sanitized)

        # Redact Secret Keys / Passwords
        sanitized = cls.SECRET_KEY_PATTERN.sub(r"\1: [REDACTED_SECRET]", sanitized)

        # Mask Credit Cards (keep last 4 digits)
        def mask_cc(match: re.Match) -> str:
            digits = re.sub(r"\D", "", match.group(0))
            if len(digits) >= 13:
                return f"****-****-****-{digits[-4:]}"
            return "[REDACTED_CARD]"

        sanitized = cls.CC_FORMATTED.sub(mask_cc, sanitized)
        sanitized = cls.CC_PATTERN.sub(mask_cc, sanitized)

        return sanitized

    @classmethod
    def mask_email(cls, email: str) -> str:
        """Partially mask an email for PII safety (e.g., c***s@email.com)."""
        if not email or "@" not in email:
            return email
        parts = email.split("@")
        user, domain = parts[0], parts[1]
        if len(user) <= 2:
            masked_user = user[0] + "*"
        else:
            masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
        return f"{masked_user}@{domain}"

    @classmethod
    def sanitize_dict(cls, data: Union[Dict[str, Any], List[Any]]) -> Union[Dict[str, Any], List[Any]]:
        """Recursively sanitizes a dictionary or list structure."""
        if isinstance(data, dict):
            new_dict = {}
            for k, v in data.items():
                lower_k = k.lower()
                if any(sec in lower_k for sec in ["password", "secret", "token", "jwt", "apikey"]):
                    new_dict[k] = "[REDACTED]"
                elif isinstance(v, str):
                    new_dict[k] = cls.sanitize_text(v)
                elif isinstance(v, (dict, list)):
                    new_dict[k] = cls.sanitize_dict(v)
                else:
                    new_dict[k] = v
            return new_dict
        elif isinstance(data, list):
            return [cls.sanitize_dict(item) if isinstance(item, (dict, list)) else (cls.sanitize_text(item) if isinstance(item, str) else item) for item in data]
        return data


data_sanitizer = DataSanitizer()
