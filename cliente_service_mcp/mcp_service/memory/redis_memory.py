"""
Redis Conversation Memory for Coffee Enterprise Chatbot.
Maintains conversational state across turns per user/client_id with automatic TTL
and transparent in-memory fallback if Redis is temporarily unreachable.
"""

import json
import logging
import os
from collections import defaultdict
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# In-memory fallback if Redis is down
_in_memory_store: Dict[str, List[Dict[str, str]]] = defaultdict(list)


class ConversationMemory:
    """Manages chat history per client_id using Redis."""

    def __init__(self):
        self.redis_client = None
        redis_host = os.getenv("REDIS_HOST", "redis")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_url = os.getenv("REDIS_URL")

        try:
            import redis
            if redis_url:
                self.redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
            else:
                self.redis_client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    db=0,
                    decode_responses=True,
                    socket_connect_timeout=2.0,
                    socket_timeout=2.0,
                )
            self.redis_client.ping()
            logger.info(f"✅ Redis Conversation Memory connected successfully to {redis_host}:{redis_port}")
        except Exception as exc:
            logger.warning(f"⚠️ Redis not reachable ({exc}). Falling back to in-process memory.")
            self.redis_client = None

    def _get_key(self, client_id: str) -> str:
        clean_id = (client_id or "default_user").replace(" ", "_")
        return f"coffee:chat:history:{clean_id}"

    def get_history(self, client_id: str, max_messages: int = 10) -> List[Dict[str, str]]:
        """Retrieve recent conversation history for a client."""
        key = self._get_key(client_id)
        if self.redis_client:
            try:
                raw_items = self.redis_client.lrange(key, -max_messages, -1)
                history = []
                for item in raw_items:
                    try:
                        history.append(json.loads(item))
                    except Exception:
                        pass
                return history
            except Exception as e:
                logger.warning(f"Error reading history from Redis: {e}")

        # Fallback in-memory
        return _in_memory_store[client_id][-max_messages:]

    def add_turn(
        self,
        client_id: str,
        user_message: str,
        model_reply: str,
        ttl_seconds: int = 7200,
    ) -> None:
        """Store a user prompt and assistant reply turn."""
        key = self._get_key(client_id)
        user_entry = json.dumps({"role": "user", "content": user_message})
        model_entry = json.dumps({"role": "model", "content": model_reply})

        if self.redis_client:
            try:
                pipe = self.redis_client.pipeline()
                pipe.rpush(key, user_entry, model_entry)
                # Keep up to 20 messages (10 turns)
                pipe.ltrim(key, -20, -1)
                pipe.expire(key, ttl_seconds)
                pipe.execute()
                return
            except Exception as e:
                logger.warning(f"Error saving turn to Redis: {e}")

        # Fallback in-memory
        _in_memory_store[client_id].append({"role": "user", "content": user_message})
        _in_memory_store[client_id].append({"role": "model", "content": model_reply})
        if len(_in_memory_store[client_id]) > 20:
            _in_memory_store[client_id] = _in_memory_store[client_id][-20:]

    def clear(self, client_id: str) -> None:
        """Clear conversation history for a client."""
        key = self._get_key(client_id)
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        _in_memory_store.pop(client_id, None)


# Global singleton
conversation_memory = ConversationMemory()
