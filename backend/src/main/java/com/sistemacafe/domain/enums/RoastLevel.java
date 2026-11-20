package com.sistemacafe.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum RoastLevel {
    LIGHT,
    MEDIUM_LIGHT,
    MEDIUM,
    MEDIUM_DARK,
    DARK;

    @JsonCreator
    public static RoastLevel fromString(String value) {
        if (value == null || value.isBlank()) {
            return MEDIUM;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace(" ", "_").replace("Í", "I");

        return switch (normalized) {
            case "CLARO", "LIGHT", "RUBIO" -> LIGHT;
            case "MEDIO_CLARO", "MEDIUM_LIGHT" -> MEDIUM_LIGHT;
            case "MEDIO", "MEDIUM" -> MEDIUM;
            case "MEDIO_OSCURO", "MEDIUM_DARK" -> MEDIUM_DARK;
            case "OSCURO", "DARK", "ESPRESSO", "ITALIANO", "FRANCES" -> DARK;
            default -> {
                try {
                    yield RoastLevel.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    yield MEDIUM;
                }
            }
        };
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
