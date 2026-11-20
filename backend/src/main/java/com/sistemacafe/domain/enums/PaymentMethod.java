package com.sistemacafe.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum PaymentMethod {
    CREDIT_CARD,
    DEBIT_CARD,
    CASH,
    BANK_TRANSFER,
    LOYALTY_POINTS;

    @JsonCreator
    public static PaymentMethod fromString(String value) {
        if (value == null) return CREDIT_CARD;
        String normalized = value.trim().toUpperCase();
        switch (normalized) {
            case "TARJETA_CREDITO":
            case "CREDIT_CARD":
                return CREDIT_CARD;
            case "TARJETA_DEBITO":
            case "DEBIT_CARD":
                return DEBIT_CARD;
            case "EFECTIVO":
            case "CASH":
                return CASH;
            case "TRANSFERENCIA":
            case "BANK_TRANSFER":
                return BANK_TRANSFER;
            case "PUNTOS_LEALTAD":
            case "LOYALTY_POINTS":
                return LOYALTY_POINTS;
            default:
                for (PaymentMethod pm : values()) {
                    if (pm.name().equalsIgnoreCase(normalized)) {
                        return pm;
                    }
                }
                return CREDIT_CARD;
        }
    }
}
