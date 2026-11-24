package com.sistemacafe;

import com.sistemacafe.config.AuditConfig;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Import(AuditConfig.class)
@ActiveProfiles("test")
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("Debe guardar y recuperar producto de cafetería")
    void shouldPersistAndRetrieveProduct() {
        Product product = Product.builder()
                .sku("CAF-CAP-001")
                .name("Cappuccino Italiano")
                .description("Espresso doble con leche texturizada y cacao")
                .unitPrice(new BigDecimal("3.50"))
                .stockQuantity(45)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .build();

        Product saved = productRepository.save(product);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getCreatedBy()).isEqualTo("SYSTEM");

        Optional<Product> found = productRepository.findBySku("CAF-CAP-001");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Cappuccino Italiano");
        assertThat(found.get().getCategory()).isEqualTo(ProductCategory.BEBIDAS_CALIENTES);
    }

    @Test
    @DisplayName("Debe descontar stock correctamente y lanzar excepción si es insuficiente")
    void shouldReduceStockAndValidateAvailability() {
        Product product = Product.builder()
                .sku("CAF-CRO-002")
                .name("Croissant de Almendras")
                .unitPrice(new BigDecimal("3.00"))
                .stockQuantity(10)
                .category(ProductCategory.REPOSTERIA)
                .active(true)
                .build();

        product.reduceStock(4);
        assertThat(product.getStockQuantity()).isEqualTo(6);

        assertThatThrownBy(() -> product.reduceStock(10))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Stock insuficiente");
    }

    @Test
    @DisplayName("Debe consultar productos con stock bajo el umbral")
    void shouldFindLowStockProducts() {
        Product p1 = Product.builder()
                .sku("CAF-LOW-01")
                .name("Matcha Latte Frío")
                .unitPrice(new BigDecimal("4.50"))
                .stockQuantity(3)
                .category(ProductCategory.BEBIDAS_FRIAS)
                .active(true)
                .build();

        Product p2 = Product.builder()
                .sku("CAF-HIGH-01")
                .name("Tostada Francesa con Miel")
                .unitPrice(new BigDecimal("6.50"))
                .stockQuantity(50)
                .category(ProductCategory.DESAYUNOS)
                .active(true)
                .build();

        productRepository.save(p1);
        productRepository.save(p2);

        List<Product> lowStock = productRepository.findByStockQuantityLessThanEqualAndActiveTrue(5);
        assertThat(lowStock).hasSize(1);
        assertThat(lowStock.get(0).getSku()).isEqualTo("CAF-LOW-01");
    }
}
