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
 * HERRAMIENTAS MCP DE GESTIÓN DE INVENTARIO Y STOCK DE CAFÉ
 * Control de existencias, alertas de rotación, reposición y valorización.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryTools {

    private final BackendApiClient backendClient;

    /**
     * Tool 9: Consultar stock disponible de un café por SKU.
     */
    @Tool(
        name = "consultar_stock",
        description = "Consulta la cantidad física disponible en bodega para un grano de café específico por su código SKU."
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
                    .message("No existe ningún grano de café con SKU: " + sku)
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
                .message(low ? "¡Alerta! Stock por debajo del límite mínimo recomendado (" + threshold + " kg)." 
                             : "Stock suficiente en bodega.")
                .build();
    }

    /**
     * Tool 10: Ajustar stock en inventario (Ingreso, Egreso o Ajuste físico).
     */
    @Tool(
        name = "ajustar_stock_inventario",
        description = "Modifica las existencias de un café por entrada de lote (INGRESO), merma o consumo (EGRESO), o ajuste de inventario."
    )
    public Map<String, Object> ajustarStockInventario(
            @ToolParam(description = "Código SKU del café") String sku,
            @ToolParam(description = "Cantidad en kg a mover o fijar") Integer cantidad,
            @ToolParam(description = "Tipo de movimiento: INGRESO, EGRESO o AJUSTE") String tipoMovimiento) {
        
        Optional<CoffeeProductDto> prodOpt = backendClient.getProductBySku(sku);
        if (prodOpt.isEmpty()) {
            return Map.of("exito", false, "mensaje", "Café no encontrado con SKU: " + sku);
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
                "mensaje", "Stock de " + p.getName() + " actualizado a " + nuevoStock + " kg"
        );
    }

    /**
     * Tool 11: Reabastecer café con lote de reposición.
     */
    @Tool(
        name = "reabastecer_cafe",
        description = "Agrega kilogramos de café a la bodega para reabastecer un lote agotado o con stock bajo."
    )
    public Map<String, Object> reabastecerCafe(
            @ToolParam(description = "Código SKU del café") String sku,
            @ToolParam(description = "Cantidad de kilogramos a ingresar (ejemplo: 25)") Integer cantidadKg) {
        
        int kg = cantidadKg != null && cantidadKg > 0 ? cantidadKg : 20;
        return ajustarStockInventario(sku, kg, "INGRESO");
    }

    /**
     * Tool 12: Consultar alertas de stock crítico.
     */
    @Tool(
        name = "alerta_stock_critico",
        description = "Lista todos los cafés con stock igual o inferior al umbral de seguridad (por defecto 10 kg), que requieren reposición inmediata."
    )
    public Map<String, Object> alertaStockCritico(
            @ToolParam(description = "Umbral límite en kg. Opcional, por defecto 10", required = false) Integer umbral) {
        
        int limit = (umbral != null && umbral > 0) ? umbral : 10;
        List<CoffeeProductDto> critical = backendClient.getLowStockProducts(limit);

        List<Map<String, Object>> items = critical.stream()
                .map(p -> Map.<String, Object>of(
                        "sku", p.getSku(),
                        "nombre", p.getName(),
                        "stockActual", p.getStockQuantity() != null ? p.getStockQuantity() : 0,
                        "umbralMinimo", limit,
                        "origen", p.getOrigin() != null ? p.getOrigin() : "Desconocido"
                ))
                .collect(Collectors.toList());

        return Map.of(
                "totalLotesCriticos", items.size(),
                "umbralConfigurado", limit,
                "requiereReabastecimiento", !items.isEmpty(),
                "lotesAfectados", items
        );
    }

    /**
     * Tool 13: Resumen global de existencias y valorización de inventario.
     */
    @Tool(
        name = "resumen_global_inventario",
        description = "Genera un balance consolidado del almacén: total de referencias de café, suma de kilogramos en inventario y valorización total en dólares."
    )
    public Map<String, Object> resumenGlobalInventario() {
        List<CoffeeProductDto> all = backendClient.getAllProducts();

        int totalReferencias = all.size();
        int totalKg = 0;
        BigDecimal valorTotal = BigDecimal.ZERO;
        int countCriticos = 0;

        for (CoffeeProductDto p : all) {
            int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
            totalKg += stock;
            if (stock <= 10) countCriticos++;
            BigDecimal price = p.getPrice() != null ? p.getPrice() : p.getUnitPrice();
            if (price != null) {
                valorTotal = valorTotal.add(price.multiply(BigDecimal.valueOf(stock)));
            }
        }

        return Map.of(
                "totalVariedadesCafe", totalReferencias,
                "totalKilosEnBodega", totalKg,
                "valorizacionTotalDolares", valorTotal,
                "lotesCriticos", countCriticos,
                "estadoGeneral", countCriticos > 0 ? "ATENCION_REQUERIDA" : "EXCELENTE",
                "mensaje", "Inventario con " + totalReferencias + " variedades y " + totalKg + " kg totales valorados en $" + valorTotal
        );
    }
}
