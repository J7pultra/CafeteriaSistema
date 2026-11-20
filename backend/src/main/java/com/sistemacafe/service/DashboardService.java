package com.sistemacafe.service;

import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.CustomerRepository;
import com.sistemacafe.domain.repository.OrderRepository;
import com.sistemacafe.domain.repository.ProductRepository;
import com.sistemacafe.dto.DashboardMetricDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    private static final int LOW_STOCK_THRESHOLD = 10;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard_metrics", key = "'summary'")
    public DashboardMetricDto getDashboardMetrics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneWeekAgo = now.minusDays(7);

        BigDecimal weeklyRevenue = orderRepository.calculateTotalRevenueBetween(oneWeekAgo, now);
        long weeklyOrders = orderRepository.countOrdersCreatedBetween(oneWeekAgo, now);
        long weeklyNewCustomers = customerRepository.countCustomersCreatedBetween(oneWeekAgo, now);

        List<Product> lowStockList = productRepository.findByStockQuantityLessThanEqualAndActiveTrue(LOW_STOCK_THRESHOLD);
        long lowStockCount = lowStockList.size();

        long activeOrders = orderRepository.countByStatus(com.sistemacafe.domain.enums.OrderStatus.PREPARING)
                + orderRepository.countByStatus(com.sistemacafe.domain.enums.OrderStatus.PENDING)
                + orderRepository.countByStatus(com.sistemacafe.domain.enums.OrderStatus.CONFIRMED);

        Map<String, Long> tierDistribution = new HashMap<>();
        for (com.sistemacafe.domain.model.Customer c : customerRepository.findAll()) {
            if (c.isActive()) {
                String tier = c.getTier() != null ? c.getTier().name() : "BRONZE";
                tierDistribution.put(tier, tierDistribution.getOrDefault(tier, 0L) + 1);
            }
        }

        Map<String, Long> roastDistribution = new HashMap<>();
        List<Product> allActive = productRepository.findAll();
        for (Product product : allActive) {
            String roast = product.getRoastLevel().name();
            roastDistribution.put(roast, roastDistribution.getOrDefault(roast, 0L) + 1);
        }

        return DashboardMetricDto.builder()
                .totalRevenueWeek(weeklyRevenue != null ? weeklyRevenue : BigDecimal.ZERO)
                .totalOrdersWeek(weeklyOrders)
                .newCustomersWeek(weeklyNewCustomers)
                .activeOrders(activeOrders)
                .customersByTier(tierDistribution)
                .lowStockProductsCount(lowStockCount)
                .salesByRoastLevel(roastDistribution)
                .build();
    }
}
