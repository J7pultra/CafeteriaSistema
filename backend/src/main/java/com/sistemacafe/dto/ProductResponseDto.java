package com.sistemacafe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sistemacafe.domain.enums.ProductCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Detalle completo de respuesta del producto de cafetería")
public class ProductResponseDto {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "CAF-HOT-001")
    private String sku;

    @Schema(example = "Cappuccino Italiano")
    private String name;

    @Schema(example = "Espresso doble con leche texturizada y fino toque de cacao en polvo")
    private String description;

    @Schema(example = "BEBIDAS_CALIENTES")
    private ProductCategory category;

    @Schema(example = "3.50")
    @JsonProperty("unitPrice")
    private BigDecimal unitPrice;

    @JsonProperty("price")
    public BigDecimal getPrice() {
        return this.unitPrice;
    }

    @Schema(example = "45")
    private Integer stockQuantity;

    @Schema(example = "https://images.unsplash.com/photo-1572442388796-11668ba67e53")
    private String imageUrl;

    @Schema(example = "true")
    private boolean active;

    @Schema(example = "false")
    private boolean lowStock;

    @Schema(example = "2026-11-24T10:00:00")
    private LocalDateTime createdAt;

    @Schema(example = "2026-11-24T10:00:00")
    private LocalDateTime updatedAt;
}
