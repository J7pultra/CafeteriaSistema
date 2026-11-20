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
@Schema(description = "Datos para actualización incremental o decremento de inventario")
public class ProductStockUpdateDto {

    public enum StockOperation {
        ADD,
        REDUCE
    }

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser de al menos 1")
    @Schema(example = "10", description = "Cantidad a modificar")
    private Integer quantity;

    @NotNull(message = "La operación es obligatoria (ADD o REDUCE)")
    @Schema(example = "ADD", description = "Tipo de ajuste de stock")
    private StockOperation operation;
}
