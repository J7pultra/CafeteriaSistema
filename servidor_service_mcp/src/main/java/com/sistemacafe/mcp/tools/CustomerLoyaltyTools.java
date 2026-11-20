package com.sistemacafe.mcp.tools;

import com.sistemacafe.mcp.client.BackendApiClient;
import com.sistemacafe.mcp.dto.CustomerLoyaltyDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Optional;

/**
 * HERRAMIENTAS MCP DE LEALTAD, FIDELIZACIÓN Y CLIENTES
 * Perfil de clientes, nivel de membresía (Bronce, Plata, Oro, Platino) y descuentos automáticos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerLoyaltyTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 20: Consultar perfil del cliente por email.
     */
    @Tool(
        name = "consultar_cliente_email",
        description = "Obtiene los datos del cliente, nivel de membresía y puntos acumulados a partir de su correo electrónico."
    )
    public CustomerLoyaltyDto consultarClienteEmail(
            @ToolParam(description = "Correo electrónico del cliente registrado") String email) {
        
        Optional<Map<String, Object>> opt = backendClient.getCustomerByEmail(email);
        if (opt.isEmpty()) {
            return CustomerLoyaltyDto.builder()
                    .email(email)
                    .fullName("Cliente No Registrado")
                    .tier("BRONCE")
                    .loyaltyPoints(0)
                    .discountPercentage(BigDecimal.ZERO)
                    .active(false)
                    .message("No existe un cliente registrado con el correo: " + email)
                    .build();
        }

        Map<String, Object> data = opt.get();
        String tier = String.valueOf(data.getOrDefault("loyaltyTier", "BRONCE"));
        int pts = data.containsKey("loyaltyPoints") ? ((Number) data.get("loyaltyPoints")).intValue() : 0;
        BigDecimal discount = calculateTierDiscount(tier);

        String first = String.valueOf(data.getOrDefault("firstName", ""));
        String last = String.valueOf(data.getOrDefault("lastName", ""));
        String name = (first + " " + last).trim();
        if (name.isBlank()) name = "Cliente Leal";

        return CustomerLoyaltyDto.builder()
                .email(email)
                .fullName(name)
                .phone(String.valueOf(data.getOrDefault("phone", "No registrado")))
                .tier(tier)
                .loyaltyPoints(pts)
                .discountPercentage(discount)
                .active(Boolean.TRUE.equals(data.get("active")))
                .message("Cliente " + name + " pertenece al nivel " + tier + " con " + pts + " puntos.")
                .build();
    }

    /**
     * Tool 21: Consultar puntos de lealtad y progreso de nivel.
     */
    @Tool(
        name = "consultar_puntos_lealtad",
        description = "Consulta cuántos puntos de lealtad tiene acumulados el cliente y cuántos le faltan para subir al siguiente nivel de beneficios."
    )
    public Map<String, Object> consultarPuntosLealtad(
            @ToolParam(description = "Correo electrónico del cliente") String email) {
        
        CustomerLoyaltyDto profile = consultarClienteEmail(email);
        int currentPoints = profile.getLoyaltyPoints() != null ? profile.getLoyaltyPoints() : 0;
        String currentTier = profile.getTier() != null ? profile.getTier() : "BRONCE";

        String nextTier = switch (currentTier) {
            case "BRONCE" -> "PLATA";
            case "PLATA" -> "ORO";
            case "ORO" -> "PLATINO";
            default -> "NIVEL_MAXIMO";
        };

        int pointsTarget = switch (currentTier) {
            case "BRONCE" -> 100;
            case "PLATA" -> 300;
            case "ORO" -> 600;
            default -> currentPoints;
        };

        int pointsNeeded = Math.max(0, pointsTarget - currentPoints);

        return Map.of(
                "email", email,
                "cliente", profile.getFullName(),
                "nivelActual", currentTier,
                "puntosActuales", currentPoints,
                "siguienteNivel", nextTier,
                "puntosFaltantesParaAscenso", pointsNeeded,
                "descuentoActual", profile.getDiscountPercentage() + "%",
                "mensaje", "Tienes " + currentPoints + " puntos (" + currentTier + "). " +
                        (pointsNeeded > 0 ? "Te faltan " + pointsNeeded + " puntos para subir a " + nextTier + "."
                                          : "¡Ya alcanzaste el máximo nivel!")
        );
    }

    /**
     * Tool 22: Calcular descuento de fidelidad para una compra.
     */
    @Tool(
        name = "calcular_descuento_fidelidad",
        description = "Calcula el ahorro y el total a pagar aplicando el descuento correspondiente al nivel del cliente (Platino: 15%, Oro: 10%, Plata: 5%, Bronce: 0%)."
    )
    public Map<String, Object> calcularDescuentoFidelidad(
            @ToolParam(description = "Correo del cliente") String email,
            @ToolParam(description = "Monto total antes de descuento en dólares") Double montoTotal) {
        
        double original = montoTotal != null && montoTotal > 0 ? montoTotal : 0.0;
        CustomerLoyaltyDto profile = consultarClienteEmail(email);
        BigDecimal discountPercent = profile.getDiscountPercentage() != null ? profile.getDiscountPercentage() : BigDecimal.ZERO;

        BigDecimal montoOriginal = BigDecimal.valueOf(original).setScale(2, RoundingMode.HALF_UP);
        BigDecimal factor = discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal ahorro = montoOriginal.multiply(factor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPagar = montoOriginal.subtract(ahorro).setScale(2, RoundingMode.HALF_UP);

        return Map.of(
                "cliente", profile.getFullName(),
                "tier", profile.getTier(),
                "porcentajeDescuento", discountPercent + "%",
                "montoOriginal", montoOriginal,
                "ahorroAplicado", ahorro,
                "totalFinalPagar", totalPagar,
                "mensaje", "Por pertenecer al nivel " + profile.getTier() + " ahorras $" + ahorro + " en tu pedido."
        );
    }

    private BigDecimal calculateTierDiscount(String tier) {
        if (tier == null) return BigDecimal.ZERO;
        return switch (tier.toUpperCase()) {
            case "PLATINO" -> BigDecimal.valueOf(15.0);
            case "ORO" -> BigDecimal.valueOf(10.0);
            case "PLATA" -> BigDecimal.valueOf(5.0);
            default -> BigDecimal.ZERO;
        };
    }
}
