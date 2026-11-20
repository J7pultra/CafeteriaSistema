package com.sistemacafe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistemacafe.config.CustomCacheErrorHandler;
import com.sistemacafe.config.RedisConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RedisConfigTest {

    private final RedisConfig redisConfig = new RedisConfig();

    @Test
    @DisplayName("Debe manejar fallos de Redis silenciosamente a través de CustomCacheErrorHandler")
    void shouldHandleRedisErrorsGracefully() {
        CustomCacheErrorHandler errorHandler = (CustomCacheErrorHandler) redisConfig.errorHandler();
        Cache mockCache = mock(Cache.class);
        when(mockCache.getName()).thenReturn("test-cache");

        RuntimeException redisException = new RuntimeException("Redis connection refused: localhost:6379");

        // Verify no exception bubbles up (graceful degradation)
        assertThatCode(() -> errorHandler.handleCacheGetError(redisException, mockCache, "key-123"))
                .doesNotThrowAnyException();
        assertThatCode(() -> errorHandler.handleCachePutError(redisException, mockCache, "key-123", "value"))
                .doesNotThrowAnyException();
        assertThatCode(() -> errorHandler.handleCacheEvictError(redisException, mockCache, "key-123"))
                .doesNotThrowAnyException();
        assertThatCode(() -> errorHandler.handleCacheClearError(redisException, mockCache))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Debe configurar ObjectMapper con soporte para JavaTimeModule en serialización Redis")
    void shouldConfigureRedisObjectMapper() throws Exception {
        ObjectMapper objectMapper = redisConfig.redisObjectMapper();
        assertThat(objectMapper).isNotNull();

        LocalDateTime now = LocalDateTime.of(2026, 11, 17, 10, 0, 0);
        String json = objectMapper.writeValueAsString(now);

        assertThat(json).contains("2026-11-17T10:00:00");
    }
}
