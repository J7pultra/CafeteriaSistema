package com.sistemacafe;

import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.ProductRepository;
import com.sistemacafe.dto.ProductResponseDto;
import com.sistemacafe.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
class ProductCacheTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private CacheManager cacheManager;

    @SpyBean
    private ProductRepository productRepository;

    private Long savedProductId;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        cacheManager.getCacheNames().forEach(name ->
                Objects.requireNonNull(cacheManager.getCache(name)).clear()
        );

        Product product = Product.builder()
                .sku("CAF-CACHE-01")
                .name("Café de Caché Test")
                .unitPrice(new BigDecimal("3.50"))
                .stockQuantity(25)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .build();

        Product saved = productRepository.save(product);
        savedProductId = saved.getId();
    }

    @Test
    @DisplayName("Debe consultar repositorio solo una vez y servir siguientes llamadas desde caché")
    void shouldCacheProductGetById() {
        // 1st call -> hits repository
        ProductResponseDto firstCall = productService.getProductById(savedProductId);
        assertThat(firstCall).isNotNull();

        // 2nd call -> served from cache
        ProductResponseDto secondCall = productService.getProductById(savedProductId);
        assertThat(secondCall).isNotNull();

        // 3rd call -> served from cache
        ProductResponseDto thirdCall = productService.getProductById(savedProductId);
        assertThat(thirdCall).isNotNull();

        // Verify repository findById was only invoked once
        verify(productRepository, times(1)).findById(savedProductId);
    }
}
