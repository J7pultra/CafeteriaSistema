package com.sistemacafe;

import com.sistemacafe.config.AuditConfig;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.enums.RoastLevel;
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
    @DisplayName("Debe guardar y recuperar producto de café de especialidad")
    void shouldPersistAndRetrieveProduct() {
        Product product = Product.builder()
                .sku("COF-EC-LOJA-001")
                .name("Geisha Puyango Honey")
                .description("Café Geisha cultivado a 1900 msnm con proceso honey")
                .origin("Loja - Puyango, Ecuador")
                .altitudeMasl(1900)
                .processMethod("Honey")
                .roastLevel(RoastLevel.LIGHT)
                .flavorNotes("Jazmín, bergamota, miel de azahar y durazno")
                .unitPrice(new BigDecimal("18.50"))
                .stockQuantity(45)
                .category(ProductCategory.SPECIALTY_BEANS)
                .active(true)
                .build();

        Product saved = productRepository.save(product);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getCreatedBy()).isEqualTo("SYSTEM");

        Optional<Product> found = productRepository.findBySku("COF-EC-LOJA-001");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Geisha Puyango Honey");
        assertThat(found.get().getRoastLevel()).isEqualTo(RoastLevel.LIGHT);
    }

    @Test
    @DisplayName("Debe descontar stock correctamente y lanzar excepción si es insuficiente")
    void shouldReduceStockAndValidateAvailability() {
        Product product = Product.builder()
                .sku("COF-EC-TYP-002")
                .name("Típica Mejorado")
                .origin("Pichincha, Ecuador")
                .roastLevel(RoastLevel.MEDIUM)
                .unitPrice(new BigDecimal("14.00"))
                .stockQuantity(10)
                .category(ProductCategory.SPECIALTY_BEANS)
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
                .sku("COF-LOW-01")
                .name("Blend Espresso Tradición")
                .origin("Loja")
                .roastLevel(RoastLevel.MEDIUM_DARK)
                .unitPrice(new BigDecimal("10.00"))
                .stockQuantity(3)
                .category(ProductCategory.ESPRESSO_SINGLE_ORIGIN)
                .active(true)
                .build();

        Product p2 = Product.builder()
                .sku("COF-HIGH-01")
                .name("Bourbon Rosado")
                .origin("Huila")
                .roastLevel(RoastLevel.LIGHT)
                .unitPrice(new BigDecimal("22.00"))
                .stockQuantity(50)
                .category(ProductCategory.SPECIALTY_BEANS)
                .active(true)
                .build();

        productRepository.save(p1);
        productRepository.save(p2);

        List<Product> lowStock = productRepository.findByStockQuantityLessThanEqualAndActiveTrue(5);
        assertThat(lowStock).hasSize(1);
        assertThat(lowStock.get(0).getSku()).isEqualTo("COF-LOW-01");
    }
}
