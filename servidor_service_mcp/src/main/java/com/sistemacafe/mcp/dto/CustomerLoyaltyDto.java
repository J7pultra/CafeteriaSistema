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
public class CustomerLoyaltyDto {
    private String email;
    private String fullName;
    private String phone;
    private String tier;
    private Integer loyaltyPoints;
    private BigDecimal discountPercentage;
    private Boolean active;
    private String message;
}
