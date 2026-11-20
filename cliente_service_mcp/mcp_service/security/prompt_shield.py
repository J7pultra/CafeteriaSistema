"""
Prompt Shield & AI Firewall.
Defends against Prompt Injection, Jailbreaks, Delimiter Tampering, and Exfiltration attacks.
"""

from dataclasses import dataclass, field
from enum import Enum
import re
from typing import List, Tuple
from mcp_service.config import settings


class RiskLevel(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class ShieldDecision:
    allowed: bool
    risk_level: RiskLevel
    risk_score: int  # 0 to 100
    reasons: List[str] = field(default_factory=list)
    sanitized_input: str = ""
    refusal_message: str = ""


class PromptShield:
    """Enterprise-grade Prompt Injection & Jailbreak Detector."""

    # 1. Jailbreak Personas & Frameworks
    JAILBREAK_PATTERNS: List[Tuple[re.Pattern, str, int]] = [
        (
            re.compile(r"\b(dan|stan|aim|mongo tom|dude|evil confidant|chaosgpt)\b", re.IGNORECASE),
            "Jailbreak persona detected (DAN/STAN/AIM variant)",
            45,
        ),
        (
            re.compile(r"developer\s+mode\s+(enabled|on|activate|now)", re.IGNORECASE),
            "Developer Mode jailbreak attempt",
            50,
        ),
        (
            re.compile(r"do\s+anything\s+now", re.IGNORECASE),
            "Classic 'Do Anything Now' pattern",
            50,
        ),
        (
            re.compile(r"you\s+are\s+no\s+longer\s+an\s+(ai|assistant|model)", re.IGNORECASE),
            "Identity removal attempt",
            40,
        ),
        (
            re.compile(r"pretend\s+(you\s+have\s+no\s+rules|you\s+are\s+unfiltered|there\s+are\s+no\s+ethics)", re.IGNORECASE),
            "Ethics/Rules bypass roleplay",
            45,
        ),
    ]

    # 2. Instruction Override & Hijacking
    OVERRIDE_PATTERNS: List[Tuple[re.Pattern, str, int]] = [
        (
            re.compile(r"ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|directives)", re.IGNORECASE),
            "Instruction override: Ignore previous instructions",
            60,
        ),
        (
            re.compile(r"disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|guidelines)", re.IGNORECASE),
            "Instruction override: Disregard instructions",
            60,
        ),
        (
            re.compile(r"forget\s+(everything\s+you\s+know|all\s+prior\s+instructions|system\s+prompt)", re.IGNORECASE),
            "Instruction override: Forget prompt",
            55,
        ),
        (
            re.compile(r"(new\s+system\s+directive|override\s+system\s+policy|new\s+rule:)", re.IGNORECASE),
            "Policy override injection",
            50,
        ),
    ]

    # 3. Delimiter Injection & Role Spoofing
    DELIMITER_PATTERNS: List[Tuple[re.Pattern, str, int]] = [
        (
            re.compile(r"(<\|im_start\|>|<\|im_end\|>|<<sys>>|<</sys>>|\[system\]|\[inst\])", re.IGNORECASE),
            "Delimiter injection (ChatML/Llama tag smuggling)",
            65,
        ),
        (
            re.compile(r"(---+\s*begin\s+system\s+prompt\s*---+|---+\s*end\s+system\s+prompt\s*---+)", re.IGNORECASE),
            "Faked system delimiter block",
            60,
        ),
        (
            re.compile(r"```(system|admin|override)", re.IGNORECASE),
            "Faked system code block markdown injection",
            50,
        ),
    ]

    # 4. Secret & System Prompt Exfiltration
    EXFILTRATION_PATTERNS: List[Tuple[re.Pattern, str, int]] = [
        (
            re.compile(r"(reveal|print|output|display|show|leak)\s+(the\s+|your\s+)?(system\s+prompt|initial\s+instructions|instructions\s+above)", re.IGNORECASE),
            "System prompt exfiltration attempt",
            55,
        ),
        (
            re.compile(r"(what\s+is|show\s+me|tell\s+me)\s+(your\s+)?(api\s+key|jwt\s+secret|db\s+password|database\s+credentials|secret\s+key)", re.IGNORECASE),
            "Credential / secret extraction attempt",
            60,
        ),
        (
            re.compile(r"(dump|export|print)\s+(all\s+)?(env|environment\s+variables|config|passwords)", re.IGNORECASE),
            "Environment variables dump attempt",
            60,
        ),
    ]

    # 5. Harmful / Malicious Injection (SQL, Shell, XSS)
    CODE_INJECTION_PATTERNS: List[Tuple[re.Pattern, str, int]] = [
        (
            re.compile(r"(\bdrop\s+table\b|\btruncate\s+table\b|\bexec(\s|\+)+(xp_cmdshell|sp_executesql))", re.IGNORECASE),
            "SQL destructive injection detected",
            70,
        ),
        (
            re.compile(r"(<script\b[^>]*>|javascript:|onerror\s*=|onload\s*=)", re.IGNORECASE),
            "XSS injection detected",
            50,
        ),
        (
            re.compile(r"(\brm\s+-rf\b|\bcat\s+/etc/passwd\b|cmd\.exe|powershell\s+-enc)", re.IGNORECASE),
            "Shell execution payload detected",
            70,
        ),
    ]

    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode

    def analyze(self, user_input: str) -> ShieldDecision:
        """
        Evaluate user input against prompt injection, jailbreak, and extraction attacks.
        Returns a ShieldDecision indicating whether the prompt is safe to process.
        """
        if not user_input or not user_input.strip():
            return ShieldDecision(
                allowed=True,
                risk_level=RiskLevel.SAFE,
                risk_score=0,
                sanitized_input="",
                refusal_message="",
            )

        # Length check
        if len(user_input) > settings.MAX_PROMPT_LENGTH:
            return ShieldDecision(
                allowed=False,
                risk_level=RiskLevel.HIGH,
                risk_score=75,
                reasons=[f"Input length ({len(user_input)}) exceeds maximum permitted ({settings.MAX_PROMPT_LENGTH})"],
                sanitized_input="",
                refusal_message="Tu mensaje excede el tamaño máximo permitido para consultas al asistente de café.",
            )

        # Normalize text for checking
        normalized = user_input.strip()
        reasons: List[str] = []
        score = 0

        # Scan all rule categories
        all_rules = [
            *self.JAILBREAK_PATTERNS,
            *self.OVERRIDE_PATTERNS,
            *self.DELIMITER_PATTERNS,
            *self.EXFILTRATION_PATTERNS,
            *self.CODE_INJECTION_PATTERNS,
        ]

        for pattern, reason, points in all_rules:
            if pattern.search(normalized):
                reasons.append(reason)
                score += points

        # Detect obfuscation / token smuggling (e.g., zero-width spaces)
        zero_width_chars = len(re.findall(r"[\u200B-\u200D\uFEFF]", normalized))
        if zero_width_chars > 3:
            reasons.append(f"Detected {zero_width_chars} hidden zero-width characters (obfuscation attempt)")
            score += 35

        # Classify risk level
        score = min(score, 100)
        if score >= 60:
            level = RiskLevel.CRITICAL
            allowed = False
        elif score >= 35:
            level = RiskLevel.HIGH
            allowed = False if self.strict_mode else True
        elif score >= 15:
            level = RiskLevel.SUSPICIOUS
            allowed = True
        else:
            level = RiskLevel.SAFE
            allowed = True

        refusal = ""
        if not allowed:
            refusal = (
                "Lo siento, tu solicitud no pudo ser procesada debido a que contiene patrones que "
                "infringen nuestras políticas de seguridad de la plataforma de café."
            )

        # Sanitize zero-width characters if allowed
        sanitized = re.sub(r"[\u200B-\u200D\uFEFF]", "", normalized)

        return ShieldDecision(
            allowed=allowed,
            risk_level=level,
            risk_score=score,
            reasons=reasons,
            sanitized_input=sanitized if allowed else "",
            refusal_message=refusal,
        )


prompt_shield = PromptShield(strict_mode=settings.SHIELD_STRICT_MODE)
