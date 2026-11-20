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
@Schema(description = "Detalle del item incluido en la orden")
public class OrderItemResponseDto {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "1")
    private Long productId;

    @Schema(example = "COF-EC-LOJA-001")
    private String productSku;

    @Schema(example = "Geisha Puyango Honey Especial")
    private String productName;

    @Schema(example = "2")
    private Integer quantity;

    @Schema(example = "18.50")
    private BigDecimal unitPrice;

    @Schema(example = "37.00")
    private BigDecimal subtotalAmount;
}
