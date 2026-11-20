package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.enums.RoastLevel;
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
@Schema(description = "Detalle completo de respuesta del producto de café")
public class ProductResponseDto {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "COF-EC-LOJA-001")
    private String sku;

    @Schema(example = "Geisha Puyango Honey Especial")
    private String name;

    @Schema(example = "Café cultivado a 1900 msnm con proceso Honey y fermentación anaeróbica")
    private String description;

    @Schema(example = "Loja - Puyango, Ecuador")
    private String origin;

    @Schema(example = "1900")
    private Integer altitudeMasl;

    @Schema(example = "Honey")
    private String processMethod;

    @Schema(example = "LIGHT")
    private RoastLevel roastLevel;

    @Schema(example = "Jazmín, flor de café, bergamota, melocotón y miel de azahar")
    private String flavorNotes;

    @Schema(example = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e")
    private String imageUrl;

    @Schema(example = "18.50")
    @com.fasterxml.jackson.annotation.JsonProperty("unitPrice")
    private BigDecimal unitPrice;

    @com.fasterxml.jackson.annotation.JsonProperty("price")
    public BigDecimal getPrice() {
        return this.unitPrice;
    }

    @Schema(example = "50")
    private Integer stockQuantity;

    @Schema(example = "SPECIALTY_BEANS")
    private ProductCategory category;

    @Schema(example = "true")
    private boolean active;

    @Schema(example = "false")
    private boolean lowStock;

    @Schema(example = "2026-11-16T10:00:00")
    private LocalDateTime createdAt;

    @Schema(example = "2026-11-16T10:00:00")
    private LocalDateTime updatedAt;
}
