"""
Sliding-Window Rate Limiter.
Prevents DoS, brute-force requests, and LLM quota starvation.
"""

from collections import defaultdict, deque
import time
from typing import Dict
from mcp_service.config import settings


class RateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self, max_requests: int = settings.RATE_LIMIT_REQUESTS_PER_MINUTE, window_seconds: float = 60.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: Dict[str, deque] = defaultdict(deque)

    def is_allowed(self, client_id: str) -> bool:
        """Checks if a request from client_id is allowed under the current rate limit."""
        now = time.time()
        client_queue = self._history[client_id]

        # Purge entries outside window
        while client_queue and (now - client_queue[0]) > self.window_seconds:
            client_queue.popleft()

        if len(client_queue) >= self.max_requests:
            return False

        client_queue.append(now)
        return True

    def get_remaining(self, client_id: str) -> int:
        """Returns the number of remaining allowed requests in the current window."""
        now = time.time()
        client_queue = self._history[client_id]
        while client_queue and (now - client_queue[0]) > self.window_seconds:
            client_queue.popleft()
        return max(0, self.max_requests - len(client_queue))

    def reset(self, client_id: str | None = None) -> None:
        """Resets rate limiting state."""
        if client_id:
            self._history.pop(client_id, None)
        else:
            self._history.clear()


rate_limiter = RateLimiter()
