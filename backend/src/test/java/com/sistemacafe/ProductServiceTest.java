package com.sistemacafe;

import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.ProductRepository;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import com.sistemacafe.dto.ProductStockUpdateDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.mapper.ProductMapper;
import com.sistemacafe.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Spy
    private ProductMapper productMapper;

    @InjectMocks
    private ProductService productService;

    private Product product;
    private ProductRequestDto requestDto;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .id(1L)
                .sku("CAF-CAP-01")
                .name("Cappuccino Italiano")
                .description("Espresso doble con leche texturizada y cacao")
                .unitPrice(new BigDecimal("3.50"))
                .stockQuantity(30)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .imageUrl("https://images.unsplash.com/photo-1572442388796-11668ba67e53")
                .active(true)
                .build();

        requestDto = ProductRequestDto.builder()
                .sku("CAF-CAP-01")
                .name("Cappuccino Italiano")
                .description("Espresso doble con leche texturizada y cacao")
                .unitPrice(new BigDecimal("3.50"))
                .stockQuantity(30)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .imageUrl("https://images.unsplash.com/photo-1572442388796-11668ba67e53")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Debe registrar producto de cafetería cuando el SKU es único")
    void shouldCreateProductSuccessfully() {
        when(productRepository.existsBySku("CAF-CAP-01")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponseDto response = productService.createProduct(requestDto);

        assertThat(response).isNotNull();
        assertThat(response.getSku()).isEqualTo("CAF-CAP-01");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Debe resolver enums en español y URLs extensas correctamente")
    void shouldHandleSpanishEnumValuesAndLongImageUrl() {
        ProductCategory cat = ProductCategory.fromString("REPOSTERIA");
        assertThat(cat).isEqualTo(ProductCategory.REPOSTERIA);

        String longGoogleUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9Gc" + "A".repeat(800);
        ProductRequestDto dto = ProductRequestDto.builder()
                .sku("CAF-CRO-01")
                .name("Croissant de Mantequilla")
                .category(cat)
                .imageUrl(longGoogleUrl)
                .unitPrice(new BigDecimal("2.50"))
                .stockQuantity(50)
                .active(true)
                .build();

        when(productRepository.existsBySku("CAF-CRO-01")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(99L);
            return p;
        });

        ProductResponseDto created = productService.createProduct(dto);
        assertThat(created).isNotNull();
        assertThat(created.getImageUrl()).isEqualTo(longGoogleUrl);
        assertThat(created.getCategory()).isEqualTo(ProductCategory.REPOSTERIA);
    }

    @Test
    @DisplayName("Debe lanzar excepción al intentar registrar producto con SKU duplicado")
    void shouldThrowExceptionWhenSkuExists() {
        when(productRepository.existsBySku("CAF-CAP-01")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(requestDto))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Ya existe un producto registrado");
    }

    @Test
    @DisplayName("Debe incrementar y reducir stock mediante updateStock")
    void shouldAdjustStockSuccessfully() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductStockUpdateDto addDto = ProductStockUpdateDto.builder()
                .quantity(10)
                .operation(ProductStockUpdateDto.StockOperation.ADD)
                .build();

        ProductResponseDto resAdd = productService.updateStock(1L, addDto);
        assertThat(resAdd.getStockQuantity()).isEqualTo(40);

        ProductStockUpdateDto reduceDto = ProductStockUpdateDto.builder()
                .quantity(15)
                .operation(ProductStockUpdateDto.StockOperation.REDUCE)
                .build();

        ProductResponseDto resReduce = productService.updateStock(1L, reduceDto);
        assertThat(resReduce.getStockQuantity()).isEqualTo(25);
    }
}
