package com.sistemacafe.mcp.controller;

import com.sistemacafe.mcp.tools.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.*;

/**
 * CONTROLADOR REST Y PUENTE HTTP PARA HERRAMIENTAS MCP
 * Permite invocar las 25 herramientas directamente vía HTTP JSON-RPC
 * además del transporte SSE nativo de Spring AI.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ToolRestController {

    private final CatalogTools catalogTools;
    private final InventoryTools inventoryTools;
    private final OrderTools orderTools;
    private final CustomerLoyaltyTools customerLoyaltyTools;
    private final BaristaExtractionTools baristaExtractionTools;

    @GetMapping("/healthz")
    public Mono<ResponseEntity<Map<String, Object>>> health() {
        return Mono.just(ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "servidor-service-mcp",
                "version", "1.0.0",
                "toolCount", 25,
                "transport", "SSE (/mcp/sse) + HTTP Bridge (/api/tools/call)"
        )));
    }

    @GetMapping("/api/tools/list")
    public Mono<ResponseEntity<Map<String, Object>>> listTools() {
        List<Map<String, Object>> tools = new ArrayList<>();

        // Catalog Tools (8)
        tools.add(toolMeta("listar_productos", "Lista todos los cafés disponibles en el catálogo con precio, tueste y stock."));
        tools.add(toolMeta("buscar_producto_sku", "Busca la ficha de un café por su código SKU."));
        tools.add(toolMeta("buscar_cafe_origen", "Encuentra cafés por país o región de origen."));
        tools.add(toolMeta("filtrar_por_tueste_categoria", "Filtra cafés por nivel de tueste y/o categoría."));
        tools.add(toolMeta("recomendar_por_notas_sabor", "Recomienda granos por afinidad a notas de sabor y cata."));
        tools.add(toolMeta("crear_producto_cafe", "Crea un nuevo café en el catálogo con precio, tueste, origen y stock."));
        tools.add(toolMeta("actualizar_precio_producto", "Actualiza el precio de venta de un café dado su SKU."));
        tools.add(toolMeta("desactivar_producto_catalogo", "Desactiva temporalmente un café de la venta al público."));

        // Inventory Tools (5)
        tools.add(toolMeta("consultar_stock", "Consulta stock físico disponible por código SKU."));
        tools.add(toolMeta("ajustar_stock_inventario", "Ajusta existencias por INGRESO, EGRESO o AJUSTE físico."));
        tools.add(toolMeta("reabastecer_cafe", "Reabastece kilogramos a un lote de café agotado o bajo."));
        tools.add(toolMeta("alerta_stock_critico", "Lista cafés con existencias críticas que requieren reposición."));
        tools.add(toolMeta("resumen_global_inventario", "Balance general de bodega: total cafés, kg en almacén y valorización."));

        // Order Tools (6)
        tools.add(toolMeta("rastrear_orden", "Rastrea el progreso y tiempo estimado de una orden por su código ORD."));
        tools.add(toolMeta("listar_ordenes_recientes", "Devuelve los pedidos más recientes de la cafetería."));
        tools.add(toolMeta("listar_ordenes_por_estado", "Filtra órdenes por PENDING, PREPARING, READY, DELIVERED, CANCELLED."));
        tools.add(toolMeta("actualizar_estado_orden", "Avanza el estado de un pedido (ej: a READY o DELIVERED)."));
        tools.add(toolMeta("cancelar_orden_pedido", "Cancela una orden activa registrando el motivo."));
        tools.add(toolMeta("consultar_ordenes_cliente", "Historial completo de pedidos por correo del cliente."));

        // Customer Loyalty Tools (3)
        tools.add(toolMeta("consultar_cliente_email", "Consulta perfil, nivel de membresía (Bronce, Plata, Oro, Platino) y puntos."));
        tools.add(toolMeta("consultar_puntos_lealtad", "Consulta saldo de puntos y cuánto falta para subir de categoría."));
        tools.add(toolMeta("calcular_descuento_fidelidad", "Calcula descuento y monto a pagar según nivel de fidelidad."));

        // Barista Extraction Tools (3)
        tools.add(toolMeta("calcular_receta_extraccion", "Calcula ratio de agua, molienda y tiempos para V60, Chemex, Aeropress, Espresso."));
        tools.add(toolMeta("formular_blend_cafe", "Formulación de mezclas de orígenes para espresso, bebidas con leche o cold brew."));
        tools.add(toolMeta("diagnosticar_salud_sistema", "Diagnóstico integral del servidor MCP y conectividad con el backend."));

        return Mono.just(ResponseEntity.ok(Map.of(
                "totalTools", tools.size(),
                "tools", tools
        )));
    }

    @PostMapping("/api/tools/call")
    public Mono<ResponseEntity<Map<String, Object>>> executeTool(@RequestBody Map<String, Object> request) {
        String toolName = (String) request.get("name");
        @SuppressWarnings("unchecked")
        Map<String, Object> args = request.containsKey("arguments") && request.get("arguments") instanceof Map<?, ?>
                ? (Map<String, Object>) request.get("arguments")
                : Collections.emptyMap();

        if (toolName == null || toolName.isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "El campo 'name' es obligatorio")));
        }

        log.info("Invocando tool MCP: {} con argumentos: {}", toolName, args);

        return Mono.fromCallable(() -> {
            Object result = dispatchTool(toolName, args);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", "SUCCESS");
            response.put("tool", toolName);
            response.put("result", result);
            response.put("structured_content", result);
            return ResponseEntity.ok(response);
        })
        .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
        .onErrorResume(e -> {
            log.error("Error ejecutando tool {}: {}", toolName, e.getMessage(), e);
            return Mono.just(ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "tool", toolName,
                    "error", e.getMessage()
            )));
        });
    }

    private Object dispatchTool(String name, Map<String, Object> args) {
        return switch (name) {
            // Catalog Tools
            case "listar_productos", "list_products" -> catalogTools.listarProductos(getBool(args, "soloActivos", "activeOnly"));
            case "buscar_producto_sku", "search_sku" -> catalogTools.buscarProductoSku(getStr(args, "sku"));
            case "buscar_cafe_origen", "search_origin" -> catalogTools.buscarCafeOrigen(getStr(args, "origen", "origin", "origin_keyword"));
            case "filtrar_por_tueste_categoria", "filter_roast_category" -> catalogTools.filtrarPorTuesteCategoria(
                    getStr(args, "tueste", "roastLevel", "roast_level"),
                    getStr(args, "categoria", "category")
            );
            case "recomendar_por_notas_sabor", "recommend_by_flavor" -> catalogTools.recomendarPorNotasSabor(
                    getStr(args, "notasDeseadas", "desired_notes", "notes")
            );
            case "crear_producto_cafe", "add_product" -> catalogTools.crearProductoCafe(
                    getStr(args, "nombre", "name"),
                    getDouble(args, "precio", "price", "unitPrice"),
                    getStr(args, "tueste", "roast_level", "roastLevel"),
                    getStr(args, "origen", "origin"),
                    getStr(args, "categoria", "category"),
                    getInt(args, "stockInicial", "stock_quantity", "stock"),
                    getStr(args, "notasCata", "flavorNotes", "description", "descripcion")
            );
            case "actualizar_precio_producto", "update_price" -> catalogTools.actualizarPrecioProducto(
                    getStr(args, "sku"),
                    getDouble(args, "nuevoPrecio", "new_price", "price")
            );
            case "desactivar_producto_catalogo", "deactivate_product" -> catalogTools.desactivarProductoCatalogo(getStr(args, "sku"));

            // Inventory Tools
            case "consultar_stock", "check_stock" -> inventoryTools.consultarStock(getStr(args, "sku"));
            case "ajustar_stock_inventario", "adjust_stock" -> inventoryTools.ajustarStockInventario(
                    getStr(args, "sku"),
                    getInt(args, "cantidad", "quantity"),
                    getStr(args, "tipoMovimiento", "movement_type")
            );
            case "reabastecer_cafe", "restock_coffee" -> inventoryTools.reabastecerCafe(
                    getStr(args, "sku"),
                    getInt(args, "cantidadKg", "quantity", "cantidad")
            );
            case "alerta_stock_critico", "get_low_stock" -> inventoryTools.alertaStockCritico(getInt(args, "umbral", "threshold"));
            case "resumen_global_inventario", "get_inventory_summary" -> inventoryTools.resumenGlobalInventario();

            // Order Tools
            case "rastrear_orden", "track_order" -> orderTools.rastrearOrden(getStr(args, "numeroOrden", "order_number", "orderNumber"));
            case "listar_ordenes_recientes", "list_recent_orders" -> orderTools.listarOrdenesRecientes(getInt(args, "limite", "limit"));
            case "listar_ordenes_por_estado", "list_orders_by_status" -> orderTools.listarOrdenesPorEstado(getStr(args, "estado", "status"));
            case "actualizar_estado_orden", "update_order_status" -> orderTools.actualizarEstadoOrden(
                    getStr(args, "numeroOrden", "order_number"),
                    getStr(args, "nuevoEstado", "new_status", "status")
            );
            case "cancelar_orden_pedido", "cancel_order" -> orderTools.cancelarOrdenPedido(
                    getStr(args, "numeroOrden", "order_number"),
                    getStr(args, "motivo", "reason")
            );
            case "consultar_ordenes_cliente", "get_customer_orders" -> orderTools.consultarOrdenesCliente(
                    getStr(args, "emailCliente", "customer_email", "email")
            );

            // Customer Loyalty Tools
            case "consultar_cliente_email", "get_customer_profile" -> customerLoyaltyTools.consultarClienteEmail(getStr(args, "email", "customer_email"));
            case "consultar_puntos_lealtad", "get_loyalty_points" -> customerLoyaltyTools.consultarPuntosLealtad(getStr(args, "email", "customer_email"));
            case "calcular_descuento_fidelidad", "calculate_loyalty_discount" -> customerLoyaltyTools.calcularDescuentoFidelidad(
                    getStr(args, "email", "customer_email"),
                    getDouble(args, "montoTotal", "total_amount", "amount")
            );

            // Barista Extraction Tools
            case "calcular_receta_extraccion", "get_barista_recipe" -> baristaExtractionTools.calcularRecetaExtraccion(
                    getStr(args, "metodo", "method"),
                    getDouble(args, "gramosCafe", "coffee_grams", "grams"),
                    getStr(args, "nivelTueste", "roast_level", "roast")
            );
            case "formular_blend_cafe", "get_blend_formulation" -> baristaExtractionTools.formularBlendCafe(
                    getStr(args, "perfilDeseado", "intensity_preference", "profile")
            );
            case "diagnosticar_salud_sistema", "check_system_health" -> baristaExtractionTools.diagnosticarSaludSistema();

            default -> throw new IllegalArgumentException("Herramienta no reconocida en el Servidor MCP: " + name);
        };
    }

    private Map<String, Object> toolMeta(String name, String desc) {
        return Map.of("name", name, "description", desc);
    }

    private String getStr(Map<String, Object> args, String... keys) {
        for (String k : keys) {
            Object val = args.get(k);
            if (val != null) {
                if (val instanceof List<?> l) {
                    return String.join(", ", l.stream().map(Object::toString).toList());
                }
                return val.toString();
            }
        }
        return null;
    }

    private Double getDouble(Map<String, Object> args, String... keys) {
        for (String k : keys) {
            Object val = args.get(k);
            if (val instanceof Number n) return n.doubleValue();
            if (val instanceof String s && !s.isBlank()) {
                try { return Double.parseDouble(s); } catch (Exception ignored) {}
            }
        }
        return null;
    }

    private Integer getInt(Map<String, Object> args, String... keys) {
        for (String k : keys) {
            Object val = args.get(k);
            if (val instanceof Number n) return n.intValue();
            if (val instanceof String s && !s.isBlank()) {
                try { return Integer.parseInt(s); } catch (Exception ignored) {}
            }
        }
        return null;
    }

    private Boolean getBool(Map<String, Object> args, String... keys) {
        for (String k : keys) {
            Object val = args.get(k);
            if (val instanceof Boolean b) return b;
            if (val instanceof String s) return Boolean.parseBoolean(s);
        }
        return null;
    }
}
