package com.sistemacafe.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Métricas analíticas ejecutivas del negocio de café")
public class DashboardMetricDto {

    @Schema(example = "1240.50")
    private BigDecimal totalRevenueWeek;

    @Schema(example = "48")
    private long totalOrdersWeek;

    @Schema(example = "15")
    private long newCustomersWeek;

    @Schema(example = "3")
    private long lowStockProductsCount;

    @Schema(example = "2")
    private long activeOrders;

    @Schema(description = "Distribución de clientes por nivel de lealtad")
    private Map<String, Long> customersByTier;

    @Schema(description = "Distribución de ventas por nivel de tueste")
    private Map<String, Long> salesByRoastLevel;

    @com.fasterxml.jackson.annotation.JsonProperty("totalRevenue")
    public BigDecimal getTotalRevenue() {
        return totalRevenueWeek != null ? totalRevenueWeek : BigDecimal.ZERO;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("totalOrders")
    public long getTotalOrders() {
        return totalOrdersWeek;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("weeklyNewCustomers")
    public long getWeeklyNewCustomers() {
        return newCustomersWeek;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("lowStockCount")
    public long getLowStockCount() {
        return lowStockProductsCount;
    }
}
