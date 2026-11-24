package com.sistemacafe.service;

import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.model.Customer;
import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.CustomerRepository;
import com.sistemacafe.domain.repository.OrderItemRepository;
import com.sistemacafe.domain.repository.OrderRepository;
import com.sistemacafe.domain.repository.ProductRepository;
import com.sistemacafe.dto.DashboardMetricDto;
import com.sistemacafe.dto.TopProductDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    private static final int LOW_STOCK_THRESHOLD = 10;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard_metrics", key = "'summary'")
    public DashboardMetricDto getDashboardMetrics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneWeekAgo = now.minusDays(7);

        // 1. Ingresos reales no cancelados
        BigDecimal totalRev = orderRepository.calculateTotalRevenue(OrderStatus.CANCELADO);
        BigDecimal totalRevenue = totalRev != null ? totalRev : BigDecimal.ZERO;

        BigDecimal weeklyRev = orderRepository.calculateTotalRevenueBetween(OrderStatus.CANCELADO, oneWeekAgo, now);
        BigDecimal weeklyRevenue = weeklyRev != null ? weeklyRev : BigDecimal.ZERO;

        // 2. Conteo de órdenes y desglose por estado
        long totalOrders = orderRepository.count();
        long weeklyOrders = orderRepository.countOrdersCreatedBetween(oneWeekAgo, now);

        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (OrderStatus status : List.of(OrderStatus.PENDIENTE, OrderStatus.CONFIRMADO, OrderStatus.EN_PREPARACION, OrderStatus.LISTO, OrderStatus.ENTREGADO, OrderStatus.CANCELADO)) {
            statusBreakdown.put(status.name(), orderRepository.countByStatus(status));
        }

        long activeOrders = orderRepository.countByStatus(OrderStatus.PENDIENTE)
                + orderRepository.countByStatus(OrderStatus.CONFIRMADO)
                + orderRepository.countByStatus(OrderStatus.EN_PREPARACION)
                + orderRepository.countByStatus(OrderStatus.LISTO);

        // 3. Clientes registrados
        long totalCustomers = customerRepository.count();
        long weeklyNewCustomers = customerRepository.countCustomersCreatedBetween(oneWeekAgo, now);

        Map<String, Long> tierDistribution = new LinkedHashMap<>();
        for (String t : List.of("BRONZE", "SILVER", "GOLD", "PLATINUM")) {
            tierDistribution.put(t, 0L);
        }
        for (Customer c : customerRepository.findAll()) {
            if (c.isActive()) {
                String tier = c.getTier() != null ? c.getTier().name() : "BRONZE";
                tierDistribution.put(tier, tierDistribution.getOrDefault(tier, 0L) + 1);
            }
        }

        // 4. Stock bajo (<= 10 unidades)
        List<Product> lowStockList = productRepository.findByStockQuantityLessThanEqualAndActiveTrue(LOW_STOCK_THRESHOLD);
        long lowStockCount = lowStockList.size();

        // 5. Ventas por Categoría de Cafetería
        Map<String, BigDecimal> salesByCategory = new LinkedHashMap<>();
        for (ProductCategory cat : List.of(
                ProductCategory.BEBIDAS_CALIENTES,
                ProductCategory.BEBIDAS_FRIAS,
                ProductCategory.REPOSTERIA,
                ProductCategory.DESAYUNOS,
                ProductCategory.SNACKS,
                ProductCategory.OTROS
        )) {
            salesByCategory.put(cat.name(), BigDecimal.ZERO);
        }

        try {
            List<Object[]> categorySales = orderItemRepository.sumSalesByCategory(OrderStatus.CANCELADO);
            for (Object[] row : categorySales) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    ProductCategory cat = (ProductCategory) row[0];
                    BigDecimal amount = row[1] instanceof BigDecimal
                            ? (BigDecimal) row[1]
                            : new BigDecimal(row[1].toString());
                    salesByCategory.put(cat.name(), amount);
                }
            }
        } catch (Exception e) {
            log.warn("Error al agregar ventas por categoría: {}", e.getMessage());
        }

        // 6. Productos más vendidos
        List<TopProductDto> topSelling = new ArrayList<>();
        try {
            List<Object[]> topRows = orderItemRepository.findTopSellingProducts(OrderStatus.CANCELADO, PageRequest.of(0, 5));
            for (Object[] row : topRows) {
                if (row != null && row.length >= 4) {
                    Long prodId = row[0] != null ? ((Number) row[0]).longValue() : 0L;
                    String prodName = row[1] != null ? row[1].toString() : "";
                    Long qty = row[2] != null ? ((Number) row[2]).longValue() : 0L;
                    BigDecimal rev = row[3] instanceof BigDecimal
                            ? (BigDecimal) row[3]
                            : (row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO);
                    topSelling.add(TopProductDto.builder()
                            .productId(prodId)
                            .name(prodName)
                            .unitsSold(qty)
                            .revenue(rev)
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Error al calcular productos más vendidos: {}", e.getMessage());
        }

        return DashboardMetricDto.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalRevenueWeek(weeklyRevenue != null ? weeklyRevenue : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .totalOrdersWeek(weeklyOrders)
                .newCustomersWeek(weeklyNewCustomers)
                .totalCustomers(totalCustomers)
                .lowStockProductsCount(lowStockCount)
                .activeOrders(activeOrders)
                .ordersByStatus(statusBreakdown)
                .customersByTier(tierDistribution)
                .salesByCategory(salesByCategory)
                .topSellingProducts(topSelling)
                .salesByRoastLevel(Collections.emptyMap())
                .build();
    }
}
