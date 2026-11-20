package com.sistemacafe.dto;

import com.sistemacafe.domain.enums.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Datos para crear una nueva orden de compra de café")
public class OrderCreateRequestDto {

    @NotNull(message = "El ID del cliente es obligatorio")
    @Schema(example = "1", description = "Identificador del cliente que realiza la compra")
    private Long customerId;

    @NotNull(message = "El método de pago es obligatorio")
    @Schema(example = "CREDIT_CARD", description = "CREDIT_CARD, DEBIT_CARD, CASH, BANK_TRANSFER, LOYALTY_POINTS")
    private PaymentMethod paymentMethod;

    @Size(max = 300, message = "Las notas no pueden superar 300 caracteres")
    @Schema(example = "Favor enviar con molienda fina para cafetera italiana y empaque sellado", description = "Notas especiales de entrega")
    private String notes;

    @NotEmpty(message = "La orden debe contener al menos un item de producto")
    @Valid
    @Schema(description = "Lista de productos y cantidades de la orden")
    private List<OrderItemRequestDto> items;
}
