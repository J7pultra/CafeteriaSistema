package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.domain.enums.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Detalle completo de respuesta de la orden de café")
public class OrderResponseDto {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "ORD-A1B2C3D4")
    private String orderNumber;

    @Schema(example = "1")
    private Long customerId;

    @Schema(example = "Carlos Valdez")
    private String customerName;

    @Schema(example = "carlos.valdez@cafespecialty.com")
    private String customerEmail;

    @Schema(example = "CONFIRMED")
    private OrderStatus status;

    @Schema(example = "CREDIT_CARD")
    private PaymentMethod paymentMethod;

    @Schema(example = "37.00")
    private BigDecimal subtotal;

    @Schema(example = "4.44")
    private BigDecimal tax;

    @Schema(example = "0.00")
    private BigDecimal discount;

    @Schema(example = "41.44")
    private BigDecimal totalAmount;

    @com.fasterxml.jackson.annotation.JsonProperty("total")
    public BigDecimal getTotal() {
        return totalAmount != null ? totalAmount : BigDecimal.ZERO;
    }

    @Schema(example = "Favor enviar con molienda fina")
    private String notes;

    @Schema(description = "Items de la orden")
    private List<OrderItemResponseDto> items;

    @Schema(example = "2026-11-16T10:00:00")
    private LocalDateTime createdAt;

    @Schema(example = "2026-11-16T10:00:00")
    private LocalDateTime updatedAt;
}
