package com.sistemacafe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistemacafe.controller.ProductController;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import com.sistemacafe.dto.ProductStockUpdateDto;
import com.sistemacafe.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("POST /api/v1/products - Debe crear producto de cafetería con 201 Created")
    void shouldReturn201WhenCreatingProduct() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .sku("CAF-AME-01")
                .name("Americano Clásico")
                .description("Espresso doble diluido con agua caliente filtrada")
                .unitPrice(new BigDecimal("2.50"))
                .stockQuantity(40)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .build();

        ProductResponseDto response = ProductResponseDto.builder()
                .id(5L)
                .sku("CAF-AME-01")
                .name("Americano Clásico")
                .unitPrice(new BigDecimal("2.50"))
                .stockQuantity(40)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .lowStock(false)
                .build();

        when(productService.createProduct(any(ProductRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.sku").value("CAF-AME-01"));
    }

    @Test
    @DisplayName("PATCH /api/v1/products/{id}/stock - Debe ajustar stock exitosamente")
    void shouldUpdateProductStock() throws Exception {
        ProductStockUpdateDto stockDto = ProductStockUpdateDto.builder()
                .quantity(10)
                .operation(ProductStockUpdateDto.StockOperation.ADD)
                .build();

        ProductResponseDto response = ProductResponseDto.builder()
                .id(5L)
                .sku("CAF-AME-01")
                .stockQuantity(50)
                .build();

        when(productService.updateStock(any(Long.class), any(ProductStockUpdateDto.class))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/products/5/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stockDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(50));
    }
}
