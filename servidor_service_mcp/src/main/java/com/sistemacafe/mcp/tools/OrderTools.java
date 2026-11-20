package com.sistemacafe.mcp.tools;

import com.sistemacafe.mcp.client.BackendApiClient;
import com.sistemacafe.mcp.dto.OrderTrackDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * HERRAMIENTAS MCP DE TRAZABILIDAD Y GESTIÓN DE PEDIDOS
 * Rastreo de órdenes, estados de preparación, historial por cliente y cancelaciones.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 14: Rastrear una orden por su código de pedido (ej: ORD-2026-0001).
     */
    @Tool(
        name = "rastrear_orden",
        description = "Rastrea el progreso y estado en tiempo real de una orden de café mediante su código de seguimiento (ej: 'ORD-2026-0001')."
    )
    public OrderTrackDto rastrearOrden(
            @ToolParam(description = "Número o código de orden (ej: ORD-2026-0001)") String numeroOrden) {
        
        Optional<Map<String, Object>> ordOpt = backendClient.getOrderByNumber(numeroOrden);
        if (ordOpt.isEmpty()) {
            return OrderTrackDto.builder()
                    .orderNumber(numeroOrden)
                    .status("NO_ENCONTRADA")
                    .progressPercentage(0)
                    .message("No encontramos ninguna orden registrada con el código " + numeroOrden)
                    .build();
        }

        Map<String, Object> ord = ordOpt.get();
        String status = String.valueOf(ord.getOrDefault("status", "PENDING"));
        int progress = switch (status) {
            case "PENDING" -> 15;
            case "CONFIRMED" -> 35;
            case "PREPARING" -> 65;
            case "READY" -> 90;
            case "DELIVERED" -> 100;
            case "CANCELLED" -> 0;
            default -> 50;
        };

        String time = switch (status) {
            case "PENDING" -> "15 - 20 minutos";
            case "PREPARING" -> "5 - 8 minutos";
            case "READY" -> "¡Lista en barra para entrega o despacho!";
            case "DELIVERED" -> "Entregada satisfactoriamente";
            case "CANCELLED" -> "Cancelada";
            default -> "10 minutos";
        };

        Object totalObj = ord.get("totalAmount");
        BigDecimal total = totalObj instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : BigDecimal.ZERO;

        @SuppressWarnings("unchecked")
        List<String> items = ord.get("itemsSummary") instanceof List<?> l
                ? l.stream().map(Object::toString).toList()
                : List.of("Café de especialidad");

        Object ordId = ord.getOrDefault("id", numeroOrden);
        String targetId = "order-card-" + ordId;

        return OrderTrackDto.builder()
                .orderNumber(String.valueOf(ord.getOrDefault("orderNumber", numeroOrden)))
                .customerName(String.valueOf(ord.getOrDefault("customerName", "Cliente")))
                .customerEmail(String.valueOf(ord.getOrDefault("customerEmail", "")))
                .status(status)
                .totalAmount(total)
                .itemCount(ord.containsKey("itemCount") ? (Integer) ord.get("itemCount") : items.size())
                .progressPercentage(progress)
                .estimatedTime(time)
                .itemsSummary(items)
                .message("Orden en estado: " + status + " (" + progress + "% completado)")
                .targetId(targetId)
                .build();
    }

    /**
     * Tool 15: Listar pedidos recientes.
     */
    @Tool(
        name = "listar_ordenes_recientes",
        description = "Devuelve los pedidos más recientes de la cafetería para que el barista o administrador puedan supervisar el flujo de comandas."
    )
    public List<Map<String, Object>> listarOrdenesRecientes(
            @ToolParam(description = "Límite máximo de órdenes a consultar (por defecto 10)", required = false) Integer limite) {
        
        int limit = (limite != null && limite > 0) ? limite : 10;
        return backendClient.getAllOrders(null).stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Tool 16: Listar órdenes por estado operativo.
     */
    @Tool(
        name = "listar_ordenes_por_estado",
        description = "Filtra órdenes por su estado de procesamiento: PENDING, PREPARING, READY, DELIVERED, CANCELLED."
    )
    public List<Map<String, Object>> listarOrdenesPorEstado(
            @ToolParam(description = "Estado a consultar: PENDING, PREPARING, READY, DELIVERED o CANCELLED") String estado) {
        
        return backendClient.getAllOrders(estado);
    }

    /**
     * Tool 17: Actualizar el estado de una orden.
     */
    @Tool(
        name = "actualizar_estado_orden",
        description = "Permite al barista o personal de barra avanzar el estado de una orden (ej: pasar de PREPARING a READY para entrega)."
    )
    public Map<String, Object> actualizarEstadoOrden(
            @ToolParam(description = "Código de la orden (ej: ORD-2026-0001)") String numeroOrden,
            @ToolParam(description = "Nuevo estado: PENDING, PREPARING, READY, DELIVERED, CANCELLED") String nuevoEstado) {
        
        Optional<Map<String, Object>> ordOpt = backendClient.getOrderByNumber(numeroOrden);
        if (ordOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "Orden " + numeroOrden + " no encontrada.");
        }

        Map<String, Object> ord = ordOpt.get();
        Long id = ord.get("id") instanceof Number n ? n.longValue() : 1L;
        String cleanStatus = nuevoEstado.trim().toUpperCase();

        boolean ok = backendClient.updateOrderStatus(id, cleanStatus);

        return Map.of(
                "exito", true,
                "orden", numeroOrden,
                "estadoAnterior", ord.getOrDefault("status", "DESCONOCIDO"),
                "nuevoEstado", cleanStatus,
                "actualizadoBackend", ok,
                "mensaje", "Estado de la orden " + numeroOrden + " actualizado a " + cleanStatus
        );
    }

    /**
     * Tool 18: Cancelar un pedido.
     */
    @Tool(
        name = "cancelar_orden_pedido",
        description = "Cancela un pedido activo por solicitud del cliente o falta de insumos, registrando el motivo."
    )
    public Map<String, Object> cancelarOrdenPedido(
            @ToolParam(description = "Código de la orden (ej: ORD-2026-0001)") String numeroOrden,
            @ToolParam(description = "Motivo de la cancelación", required = false) String motivo) {
        
        String cleanMotivo = motivo != null ? motivo : "Solicitud del cliente";
        Map<String, Object> res = new LinkedHashMap<>(actualizarEstadoOrden(numeroOrden, "CANCELLED"));
        res.put("motivo", cleanMotivo);
        res.put("mensaje", "La orden " + numeroOrden + " ha sido CANCELADA. Motivo: " + cleanMotivo);
        return res;
    }

    /**
     * Tool 19: Consultar historial de compras de un cliente por su correo.
     */
    @Tool(
        name = "consultar_ordenes_cliente",
        description = "Consulta todos los pedidos previos registrados por un cliente dado su correo electrónico."
    )
    public Map<String, Object> consultarOrdenesCliente(
            @ToolParam(description = "Correo electrónico del cliente") String emailCliente) {
        
        if (emailCliente == null || emailCliente.isBlank()) {
            return Map.of("totalOrdenes", 0, "mensaje", "El email es obligatorio");
        }

        String cleanEmail = emailCliente.trim().toLowerCase();
        List<Map<String, Object>> all = backendClient.getAllOrders(null);
        List<Map<String, Object>> customerOrders = all.stream()
                .filter(o -> {
                    Object emailObj = o.get("customerEmail");
                    return emailObj != null && emailObj.toString().equalsIgnoreCase(cleanEmail);
                })
                .collect(Collectors.toList());

        return Map.of(
                "clienteEmail", cleanEmail,
                "totalOrdenes", customerOrders.size(),
                "ordenes", customerOrders,
                "mensaje", "Se encontraron " + customerOrders.size() + " órdenes para el cliente."
        );
    }
}
