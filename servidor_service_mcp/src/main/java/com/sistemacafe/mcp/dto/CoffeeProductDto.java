package com.sistemacafe.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoffeeProductDto {
    private Long id;
    private String sku;
    private String name;
    private String origin;
    private Integer altitudeMasl;
    private String processMethod;
    private String roastLevel;
    private String category;
    private BigDecimal price;
    private BigDecimal unitPrice;
    private Integer stockQuantity;
    private String description;
    private String flavorNotes;
    private String imageUrl;
    private Boolean active;
}
