package com.sistemacafe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.enums.RoastLevel;
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
@Schema(description = "Datos para crear o actualizar un producto de café")
public class ProductRequestDto {

    @NotBlank(message = "El código SKU es obligatorio")
    @Size(min = 3, max = 50, message = "El SKU debe tener entre 3 y 50 caracteres")
    @Schema(example = "COF-EC-LOJA-001", description = "Identificador único de inventario")
    private String sku;

    @NotBlank(message = "El nombre del producto no puede estar vacío")
    @Size(min = 3, max = 120, message = "El nombre debe tener entre 3 y 120 caracteres")
    @Schema(example = "Geisha Puyango Honey Especial", description = "Nombre comercial del café")
    private String name;

    @Size(max = 2000, message = "La descripción no puede superar los 2000 caracteres")
    @Schema(example = "Café cultivado a 1900 msnm con proceso Honey y fermentación anaeróbica", description = "Descripción sensorial")
    private String description;

    @NotBlank(message = "El origen del café es obligatorio")
    @Size(max = 100, message = "El origen no puede exceder 100 caracteres")
    @Schema(example = "Loja - Puyango, Ecuador", description = "Región y finca de origen")
    private String origin;

    @Min(value = 500, message = "La altitud mínima debe ser de al menos 500 msnm")
    @Schema(example = "1900", description = "Altitud de cultivo en metros sobre el nivel del mar")
    private Integer altitudeMasl;

    @Size(max = 50, message = "El método de proceso no puede superar los 50 caracteres")
    @Schema(example = "Honey", description = "Método de beneficio: Washed, Natural, Honey, etc.")
    private String processMethod;

    @NotNull(message = "El nivel de tueste es obligatorio")
    @Schema(example = "LIGHT", description = "LIGHT, MEDIUM_LIGHT, MEDIUM, MEDIUM_DARK, DARK")
    private RoastLevel roastLevel;

    @Size(max = 1000, message = "Las notas de cata no pueden superar los 1000 caracteres")
    @Schema(example = "Jazmín, flor de café, bergamota, melocotón y miel de azahar", description = "Notas sensoriales de cata")
    private String flavorNotes;

    @Size(max = 4000, message = "La URL de la imagen no puede superar los 4000 caracteres")
    @Schema(example = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e", description = "URL de miniatura del producto")
    private String imageUrl;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio unitario debe ser mayor a cero")
    @Schema(example = "18.50", description = "Precio de venta por unidad o bolsa")
    private BigDecimal unitPrice;

    public void setPrice(BigDecimal price) {
        if (this.unitPrice == null && price != null) {
            this.unitPrice = price;
        }
    }

    @NotNull(message = "La cantidad en stock es obligatoria")
    @Min(value = 0, message = "El stock inicial no puede ser negativo")
    @Schema(example = "50", description = "Unidades disponibles en inventario")
    private Integer stockQuantity;

    @NotNull(message = "La categoría de producto es obligatoria")
    @Schema(example = "SPECIALTY_BEANS", description = "Categoría del producto")
    private ProductCategory category;

    @Builder.Default
    @Schema(example = "true", description = "Estado activo/disponible para venta")
    private boolean active = true;
}
