package com.sistemacafe.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
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
@Schema(description = "Item de producto para la orden")
public class OrderItemRequestDto {

    @NotNull(message = "El ID del producto es obligatorio")
    @Schema(example = "1", description = "Identificador del producto en catálogo")
    private Long productId;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad mínima por item es 1")
    @Schema(example = "2", description = "Unidades solicitadas")
    private Integer quantity;
}
