package com.sistemacafe.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ProductCategory {
    BEBIDAS_CALIENTES("Bebidas Calientes"),
    BEBIDAS_FRIAS("Bebidas Frías"),
    REPOSTERIA("Repostería"),
    DESAYUNOS("Desayunos"),
    SNACKS("Snacks"),
    OTROS("Otros"),

    // Aliases históricos para compatibilidad
    SPECIALTY_BEANS("Bebidas Calientes"),
    ESPRESSO_SINGLE_ORIGIN("Bebidas Calientes"),
    COLD_BREW_BLEND("Bebidas Frías"),
    DECAF_ORGANIC("Bebidas Calientes"),
    BARISTA_EQUIPMENT("Otros");

    private final String displayName;

    ProductCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ProductCategory fromString(String value) {
        if (value == null || value.isBlank()) {
            return BEBIDAS_CALIENTES;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT)
                .replace(" ", "_")
                .replace("Í", "I")
                .replace("Ú", "U")
                .replace("Á", "A")
                .replace("É", "E")
                .replace("Ó", "O");

        return switch (normalized) {
            case "BEBIDAS_CALIENTES", "BEBIDA_CALIENTE", "CALIENTES", "HOT_DRINKS", "SPECIALTY_BEANS", "ESPECIALIDAD", "GRANOS", "BEANS" -> BEBIDAS_CALIENTES;
            case "BEBIDAS_FRIAS", "BEBIDA_FRIA", "FRIAS", "COLD_DRINKS", "COLD_BREW_BLEND", "COLD_BREW", "MEZCLA", "BLEND" -> BEBIDAS_FRIAS;
            case "REPOSTERIA", "PANADERIA", "PASTELERIA", "BAKERY", "PASTRY" -> REPOSTERIA;
            case "DESAYUNOS", "DESAYUNO", "BREAKFAST", "BRUNCH" -> DESAYUNOS;
            case "SNACKS", "SNACK", "BOCADITOS", "PIQUEOS" -> SNACKS;
            case "ESPRESSO_SINGLE_ORIGIN", "ORIGEN_UNICO", "SINGLE_ORIGIN", "DECAF_ORGANIC", "DESCAFEINADO", "DECAF" -> BEBIDAS_CALIENTES;
            case "BARISTA_EQUIPMENT", "EQUIPAMIENTO", "EQUIPMENT", "ACCESORIOS", "OTROS", "OTHER" -> OTROS;
            default -> {
                try {
                    yield ProductCategory.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    yield OTROS;
                }
            }
        };
    }

    @JsonValue
    public String toValue() {
        return switch (this) {
            case SPECIALTY_BEANS, ESPRESSO_SINGLE_ORIGIN, DECAF_ORGANIC -> "BEBIDAS_CALIENTES";
            case COLD_BREW_BLEND -> "BEBIDAS_FRIAS";
            case BARISTA_EQUIPMENT -> "OTROS";
            default -> this.name();
        };
    }
}
