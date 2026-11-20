package com.sistemacafe.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTrackDto {
    private String orderNumber;
    private String customerName;
    private String customerEmail;
    private String status;
    private BigDecimal totalAmount;
    private Integer itemCount;
    private Integer progressPercentage;
    private String estimatedTime;
    private List<String> itemsSummary;
    private String message;
    private String targetId;
}
