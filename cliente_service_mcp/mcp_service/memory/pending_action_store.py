"""
Redis Confirmation Store for Two-Step (Human-in-the-Loop) Critical Actions.
Stores pending administrative actions under key:
  coffee:pending_action:{client_id}
with a 60-second TTL.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

try:
    import redis
except ImportError:
    redis = None

logger = logging.getLogger("mcp-pending-actions")


class PendingActionStore:
    def __init__(self):
        self.host = os.getenv("REDIS_HOST", "coffee-redis")
        self.port = int(os.getenv("REDIS_PORT", "6379"))
        self._client: Optional[Any] = None
        self._memory_fallback: Dict[str, Dict[str, Any]] = {}

    def _get_redis(self) -> Optional[Any]:
        if self._client is not None:
            return self._client
        if redis is None:
            return None
        try:
            r = redis.Redis(
                host=self.host,
                port=self.port,
                db=1,  # DB 1 for pending action tokens (isolated from chat history)
                decode_responses=True,
                socket_timeout=2.0,
            )
            r.ping()
            self._client = r
            return self._client
        except Exception as exc:
            logger.warning(f"Could not connect to Redis for pending actions: {exc}. Using fallback memory.")
            return None

    def store_pending_action(self, client_id: str, action_data: Dict[str, Any], ttl_seconds: int = 60) -> bool:
        """
        Stores pending critical action for client_id with given TTL (default 60s).
        """
        key = f"coffee:pending_action:{client_id}"
        r = self._get_redis()
        if r:
            try:
                r.setex(key, ttl_seconds, json.dumps(action_data, ensure_ascii=False))
                logger.info(f"Stored pending action in Redis for {client_id}: {action_data.get('action')}")
                return True
            except Exception as exc:
                logger.error(f"Redis setex failed: {exc}")
        self._memory_fallback[key] = action_data
        return True

    def get_pending_action(self, client_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves pending action for client_id if not expired.
        """
        key = f"coffee:pending_action:{client_id}"
        r = self._get_redis()
        if r:
            try:
                raw = r.get(key)
                if raw:
                    return json.loads(raw)
                return None
            except Exception as exc:
                logger.error(f"Redis get failed: {exc}")
        return self._memory_fallback.get(key)

    def clear_pending_action(self, client_id: str) -> None:
        """
        Deletes the pending action key upon successful execution or cancellation.
        """
        key = f"coffee:pending_action:{client_id}"
        r = self._get_redis()
        if r:
            try:
                r.delete(key)
                logger.info(f"Cleared pending action from Redis for {client_id}")
            except Exception as exc:
                logger.error(f"Redis delete failed: {exc}")
        self._memory_fallback.pop(key, None)


pending_action_store = PendingActionStore()
