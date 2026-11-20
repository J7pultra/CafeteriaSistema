package com.sistemacafe.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.lang.NonNull;

/**
 * Resilient CacheErrorHandler that logs Redis connection or serialization errors
 * and gracefully falls back to database execution without failing client requests.
 */
public class CustomCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
        log.warn("Error al recuperar clave '{}' de la caché '{}'. Procediendo con fallback directo a BD: {}",
                key, cache.getName(), exception.getMessage());
    }

    @Override
    public void handleCachePutError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key, Object value) {
        log.warn("Error al escribir clave '{}' en la caché '{}': {}", key, cache.getName(), exception.getMessage());
    }

    @Override
    public void handleCacheEvictError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
        log.warn("Error al invalidar clave '{}' de la caché '{}': {}", key, cache.getName(), exception.getMessage());
    }

    @Override
    public void handleCacheClearError(@NonNull RuntimeException exception, @NonNull Cache cache) {
        log.warn("Error al vaciar la caché '{}': {}", cache.getName(), exception.getMessage());
    }
}
