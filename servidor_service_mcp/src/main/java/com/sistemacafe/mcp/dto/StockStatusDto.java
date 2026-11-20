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
public class StockStatusDto {
    private String sku;
    private String name;
    private Integer currentStock;
    private Integer minThreshold;
    private String status;
    private BigDecimal price;
    private Boolean isLowStock;
    private String message;
}
