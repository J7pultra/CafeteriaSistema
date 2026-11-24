package com.sistemacafe.mcp.tools;

import com.sistemacafe.mcp.client.BackendApiClient;
import com.sistemacafe.mcp.dto.CoffeeProductDto;
import com.sistemacafe.mcp.dto.StockStatusDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * HERRAMIENTAS MCP DE GESTIÓN DE INVENTARIO Y STOCK DE CAFETERÍA
 * Control de existencias por unidad, alertas de rotación y reposición comercial.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 9: Consultar stock disponible de un producto por SKU.
     */
    @Tool(
        name = "consultar_stock",
        description = "Consulta la cantidad de unidades físicas disponibles en inventario para un producto por su código SKU."
    )
    public StockStatusDto consultarStock(
            @ToolParam(description = "Código SKU del producto a consultar") String sku) {
        
        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return StockStatusDto.builder()
                    .sku(sku)
                    .name("No encontrado")
                    .currentStock(0)
                    .minThreshold(10)
                    .status("NO_REGISTRADO")
                    .isLowStock(false)
                    .message("No existe ningún producto con SKU: " + sku)
                    .build();
        }

        CoffeeProductDto p = prodOpt.get();
        int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
        int threshold = 10;
        boolean low = stock <= threshold;

        return StockStatusDto.builder()
                .sku(p.getSku())
                .name(p.getName())
                .currentStock(stock)
                .minThreshold(threshold)
                .status(low ? "STOCK_CRITICO" : "OPTIMO")
                .price(p.getPrice())
                .isLowStock(low)
                .message(low ? "¡Alerta! Stock por debajo del límite mínimo (" + threshold + " unidades)." 
                             : "Stock suficiente en inventario (" + stock + " unidades).")
                .build();
    }

    /**
     * Tool 10: Ajustar stock en inventario (Ingreso, Egreso o Ajuste físico).
     */
    @Tool(
        name = "ajustar_stock_inventario",
        description = "Modifica las existencias de un producto por ingreso de mercancía (INGRESO), venta o consumo (EGRESO), o ajuste de inventario."
    )
    public Map<String, Object> ajustarStockInventario(
            @ToolParam(description = "Código SKU del producto") String sku,
            @ToolParam(description = "Cantidad en unidades a mover o fijar") Integer cantidad,
            @ToolParam(description = "Tipo de movimiento: INGRESO, EGRESO o AJUSTE") String tipoMovimiento) {
        
        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "Producto no encontrado con SKU: " + sku);
        }

        CoffeeProductDto p = prodOpt.get();
        int stockActual = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
        int nuevoStock = stockActual;
        String tipo = tipoMovimiento != null ? tipoMovimiento.toUpperCase().trim() : "INGRESO";

        switch (tipo) {
            case "INGRESO":
                nuevoStock = stockActual + Math.abs(cantidad);
                break;
            case "EGRESO":
                nuevoStock = Math.max(0, stockActual - Math.abs(cantidad));
                break;
            case "AJUSTE":
            default:
                nuevoStock = Math.max(0, cantidad);
                break;
        }

        p.setStockQuantity(nuevoStock);
        if (p.getId() != null) {
            backendClient.updateStock(p.getId(), cantidad, tipo);
        }

        return Map.of(
                "exito", true,
                "sku", p.getSku(),
                "nombre", p.getName(),
                "stockAnterior", stockActual,
                "movimiento", tipo,
                "cantidadOperada", cantidad,
                "nuevoStock", nuevoStock,
                "mensaje", "Stock de " + p.getName() + " actualizado a " + nuevoStock + " unidades"
        );
    }

    /**
     * Tool 11: Reabastecer producto con stock de reposición.
     */
    @Tool(
        name = "reabastecer_cafe",
        description = "Agrega unidades al inventario para reabastecer un producto agotado o con stock bajo."
    )
    public Map<String, Object> reabastecerCafe(
            @ToolParam(description = "Código SKU del producto") String sku,
            @ToolParam(description = "Cantidad de unidades a ingresar (ejemplo: 25)") Integer cantidadUnidades) {
        
        int qty = cantidadUnidades != null && cantidadUnidades > 0 ? cantidadUnidades : 20;
        return ajustarStockInventario(sku, qty, "INGRESO");
    }

    /**
     * Tool 12: Consultar alertas de stock crítico.
     */
    @Tool(
        name = "alerta_stock_critico",
        description = "Lista todos los productos con stock igual o inferior al umbral de seguridad (por defecto 10 unidades), que requieren reposición."
    )
    public Map<String, Object> alertaStockCritico(
            @ToolParam(description = "Umbral límite en unidades. Opcional, por defecto 10", required = false) Integer umbral) {
        
        int limit = (umbral != null && umbral > 0) ? umbral : 10;
        List<CoffeeProductDto> critical = backendClient.getLowStockProducts(limit);

        List<Map<String, Object>> items = critical.stream()
                .map(p -> Map.<String, Object>of(
                        "sku", p.getSku(),
                        "nombre", p.getName(),
                        "stockActual", p.getStockQuantity(),
                        "precio", p.getPrice() != null ? p.getPrice() : p.getUnitPrice(),
                        "categoria", p.getCategory()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "umbralConsultado", limit,
                "totalCriticos", items.size(),
                "productosCriticos", items,
                "mensaje", items.isEmpty() ? "Inventario en estado óptimo. No hay productos críticos." 
                                           : "Atención: " + items.size() + " producto(s) con stock crítico."
        );
    }

    /**
     * Tool 13: Resumen global de inventario.
     */
    @Tool(
        name = "resumen_global_inventario",
        description = "Proporciona una vista consolidada del inventario de la cafetería."
    )
    public Map<String, Object> resumenGlobalInventario() {
        List<CoffeeProductDto> all = backendClient.getAllProducts();
        int totalProducts = all.size();
        int totalUnits = all.stream().mapToInt(p -> p.getStockQuantity() != null ? p.getStockQuantity() : 0).sum();
        BigDecimal totalValue = all.stream()
                .map(p -> {
                    BigDecimal pr = p.getPrice() != null ? p.getPrice() : (p.getUnitPrice() != null ? p.getUnitPrice() : BigDecimal.ZERO);
                    return pr.multiply(BigDecimal.valueOf(p.getStockQuantity() != null ? p.getStockQuantity() : 0));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "totalProductos", totalProducts,
                "unidadesTotales", totalUnits,
                "valorInventario", totalValue,
                "mensaje", "Inventario consolidado: " + totalProducts + " productos, " + totalUnits + " unidades disponibles."
        );
    }
}
