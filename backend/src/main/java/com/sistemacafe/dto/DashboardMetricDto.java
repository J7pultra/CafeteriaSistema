package com.sistemacafe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Métricas analíticas ejecutivas del negocio de cafetería")
public class DashboardMetricDto {

    @Schema(example = "3450.00", description = "Ingresos totales históricos acumulados de órdenes no canceladas")
    private BigDecimal totalRevenue;

    @Schema(example = "1240.50", description = "Ingresos en los últimos 7 días de órdenes no canceladas")
    private BigDecimal totalRevenueWeek;

    @Schema(example = "150", description = "Total de órdenes históricas procesadas")
    private long totalOrders;

    @Schema(example = "48", description = "Total de órdenes en los últimos 7 días")
    private long totalOrdersWeek;

    @Schema(example = "15", description = "Nuevos clientes registrados en los últimos 7 días")
    private long newCustomersWeek;

    @Schema(example = "85", description = "Total de clientes registrados en el sistema")
    private long totalCustomers;

    @Schema(example = "3", description = "Productos con stock bajo (<= 10 unidades)")
    private long lowStockProductsCount;

    @Schema(example = "5", description = "Órdenes en preparación, confirmadas o pendientes")
    private long activeOrders;

    @Schema(description = "Desglose de órdenes por estado")
    private Map<String, Long> ordersByStatus;

    @Schema(description = "Distribución de clientes por nivel de lealtad")
    private Map<String, Long> customersByTier;

    @Schema(description = "Ventas e ingresos totales agrupados por categoría de producto")
    private Map<String, BigDecimal> salesByCategory;

    @Schema(description = "Productos más vendidos en el sistema")
    @Builder.Default
    private List<TopProductDto> topSellingProducts = Collections.emptyList();

    @Schema(description = "Distribución histórica (retrocompatibilidad)")
    @Builder.Default
    private Map<String, Long> salesByRoastLevel = Collections.emptyMap();

    @JsonProperty("weeklyNewCustomers")
    public long getWeeklyNewCustomers() {
        return newCustomersWeek;
    }

    @JsonProperty("lowStockCount")
    public long getLowStockCount() {
        return lowStockProductsCount;
    }
}
