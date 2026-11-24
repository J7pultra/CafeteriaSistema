package com.sistemacafe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sistemacafe.domain.enums.ProductCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "Datos para crear o actualizar un producto de cafetería")
public class ProductRequestDto {

    @Size(max = 50, message = "El SKU no puede superar 50 caracteres")
    @Schema(example = "CAF-HOT-001", description = "Identificador único de inventario (opcional, autogenerado si no se ingresa)")
    private String sku;

    @NotBlank(message = "El nombre del producto no puede estar vacío")
    @Size(min = 2, max = 120, message = "El nombre debe tener entre 2 y 120 caracteres")
    @Schema(example = "Cappuccino Italiano", description = "Nombre comercial del producto")
    private String name;

    @NotNull(message = "La categoría de producto es obligatoria")
    @Schema(example = "BEBIDAS_CALIENTES", description = "Categoría: BEBIDAS_CALIENTES, BEBIDAS_FRIAS, REPOSTERIA, DESAYUNOS, SNACKS, OTROS")
    private ProductCategory category;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio unitario debe ser mayor a cero")
    @Schema(example = "3.50", description = "Precio de venta unitario en USD")
    private BigDecimal unitPrice;

    public void setPrice(BigDecimal price) {
        if (this.unitPrice == null && price != null) {
            this.unitPrice = price;
        }
    }

    public BigDecimal getPrice() {
        return this.unitPrice;
    }

    @NotNull(message = "La cantidad en stock es obligatoria")
    @Min(value = 0, message = "El stock inicial no puede ser negativo")
    @Schema(example = "45", description = "Unidades disponibles en inventario")
    private Integer stockQuantity;

    @Size(max = 2000, message = "La descripción no puede superar los 2000 caracteres")
    @Schema(example = "Espresso doble con leche texturizada y fino toque de cacao en polvo", description = "Descripción del producto")
    private String description;

    @Size(max = 4000, message = "La URL de la imagen no puede superar los 4000 caracteres")
    @Schema(example = "https://images.unsplash.com/photo-1572442388796-11668ba67e53", description = "URL de imagen del producto")
    private String imageUrl;

    @Builder.Default
    @Schema(example = "true", description = "Estado activo/disponible para la venta")
    private boolean active = true;
}
