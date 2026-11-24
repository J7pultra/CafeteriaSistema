package com.sistemacafe.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Producto destacado en ventas")
public class TopProductDto {

    @Schema(example = "1")
    private Long productId;

    @Schema(example = "Cappuccino Italiano")
    private String name;

    @Schema(example = "120")
    private Long unitsSold;

    @Schema(example = "420.00")
    private BigDecimal revenue;
}
