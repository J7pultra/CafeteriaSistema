package com.sistemacafe.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ProductCategory {
    SPECIALTY_BEANS,
    ESPRESSO_SINGLE_ORIGIN,
    COLD_BREW_BLEND,
    DECAF_ORGANIC,
    BARISTA_EQUIPMENT;

    @JsonCreator
    public static ProductCategory fromString(String value) {
        if (value == null || value.isBlank()) {
            return SPECIALTY_BEANS;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace(" ", "_").replace("Ú", "U").replace("Í", "I");

        return switch (normalized) {
            case "ORIGEN_UNICO", "SINGLE_ORIGIN", "ESPRESSO_SINGLE_ORIGIN" -> ESPRESSO_SINGLE_ORIGIN;
            case "MEZCLA", "BLEND", "COLD_BREW", "COLD_BREW_BLEND" -> COLD_BREW_BLEND;
            case "DESCAFEINADO", "DECAF", "DECAF_ORGANIC" -> DECAF_ORGANIC;
            case "EQUIPAMIENTO", "EQUIPMENT", "ACCESORIOS", "BARISTA_EQUIPMENT" -> BARISTA_EQUIPMENT;
            case "ESPECIALIDAD", "SPECIALTY", "SPECIALTY_BEANS", "GRANO", "BEANS" -> SPECIALTY_BEANS;
            default -> {
                try {
                    yield ProductCategory.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    yield SPECIALTY_BEANS;
                }
            }
        };
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
