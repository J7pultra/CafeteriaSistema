package com.sistemacafe.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum OrderStatus {
    PENDIENTE,
    CONFIRMADO,
    EN_PREPARACION,
    LISTO,
    ENTREGADO,
    CANCELADO,

    // Aliases para compatibilidad histórica
    PENDING,
    CONFIRMED,
    PREPARING,
    READY_FOR_PICKUP,
    IN_DELIVERY,
    DELIVERED,
    CANCELLED;

    @JsonCreator
    public static OrderStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return PENDIENTE;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT)
                .replace(" ", "_")
                .replace("Ó", "O");

        return switch (normalized) {
            case "PENDIENTE", "PENDING" -> PENDIENTE;
            case "CONFIRMADO", "CONFIRMED" -> CONFIRMADO;
            case "EN_PREPARACION", "EN_PREPARACIÓN", "PREPARING", "PREPARACION" -> EN_PREPARACION;
            case "LISTO", "READY", "READY_FOR_PICKUP" -> LISTO;
            case "ENTREGADO", "DELIVERED", "IN_DELIVERY" -> ENTREGADO;
            case "CANCELADO", "CANCELLED", "CANCELED" -> CANCELADO;
            default -> {
                try {
                    yield OrderStatus.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    yield PENDIENTE;
                }
            }
        };
    }

    @JsonValue
    public String toValue() {
        return switch (this) {
            case PENDING, PENDIENTE -> "PENDIENTE";
            case CONFIRMED, CONFIRMADO -> "CONFIRMADO";
            case PREPARING, EN_PREPARACION -> "EN_PREPARACION";
            case READY_FOR_PICKUP, LISTO -> "LISTO";
            case IN_DELIVERY, DELIVERED, ENTREGADO -> "ENTREGADO";
            case CANCELLED, CANCELADO -> "CANCELADO";
        };
    }
}
