package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para actualización de estado del pedido")
public class OrderStatusUpdateDto {

    @NotNull(message = "El nuevo estado de la orden es obligatorio")
    @Schema(example = "PREPARING", description = "PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, IN_DELIVERY, DELIVERED, CANCELLED")
    private OrderStatus status;
}
