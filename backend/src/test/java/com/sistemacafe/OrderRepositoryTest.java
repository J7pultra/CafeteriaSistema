package com.sistemacafe;

import com.sistemacafe.config.AuditConfig;
import com.sistemacafe.domain.enums.CustomerTier;
import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.domain.enums.PaymentMethod;
import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.enums.RoastLevel;
import com.sistemacafe.domain.model.Customer;
import com.sistemacafe.domain.model.Order;
import com.sistemacafe.domain.model.OrderItem;
import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.CustomerRepository;
import com.sistemacafe.domain.repository.OrderRepository;
import com.sistemacafe.domain.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(AuditConfig.class)
@ActiveProfiles("test")
class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("Debe persistir una orden con sus items en cascada y calcular totales con IVA 12%")
    void shouldPersistOrderWithItemsAndRecalculateTotals() {
        // 1. Arrange Customer & Product
        Customer customer = customerRepository.save(Customer.builder()
                .firstName("Mateo")
                .lastName("Morales")
                .email("mateo.morales@coffeelover.com")
                .tier(CustomerTier.GOLD)
                .build());

        Product product = productRepository.save(Product.builder()
                .sku("COF-SIDRA-001")
                .name("Variedad Sidra Lavado")
                .origin("Pichincha, Nanegal")
                .roastLevel(RoastLevel.LIGHT)
                .unitPrice(new BigDecimal("20.00"))
                .stockQuantity(100)
                .category(ProductCategory.SPECIALTY_BEANS)
                .active(true)
                .build());

        // 2. Build Order
        Order order = Order.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .notes("Empaque hermético con válvula desgasificadora")
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(2)
                .unitPrice(product.getUnitPrice())
                .build();
        item.calculateSubtotal(); // 2 * 20.00 = 40.00

        order.addItem(item); // subtotal = 40.00, tax 12% = 4.80, total = 44.80

        // 3. Act
        Order savedOrder = orderRepository.save(order);

        // 4. Assert
        assertThat(savedOrder.getId()).isNotNull();
        assertThat(savedOrder.getItems()).hasSize(1);
        assertThat(savedOrder.getSubtotal()).isEqualByComparingTo(new BigDecimal("40.00"));
        assertThat(savedOrder.getTax()).isEqualByComparingTo(new BigDecimal("4.80"));
        assertThat(savedOrder.getTotalAmount()).isEqualByComparingTo(new BigDecimal("44.80"));
        assertThat(savedOrder.getCreatedAt()).isNotNull();

        Optional<Order> retrieved = orderRepository.findByOrderNumber(savedOrder.getOrderNumber());
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getCustomer().getEmail()).isEqualTo("mateo.morales@coffeelover.com");
    }

    @Test
    @DisplayName("Debe calcular ingresos totales entre rangos de fechas excluyendo órdenes canceladas")
    void shouldCalculateTotalRevenueExcludingCancelledOrders() {
        Customer customer = customerRepository.save(Customer.builder()
                .firstName("Sofía")
                .lastName("Castro")
                .email("sofia.castro@latteart.ec")
                .build());

        Order confirmedOrder = Order.builder()
                .orderNumber("ORD-CONFIRMED-01")
                .customer(customer)
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.DEBIT_CARD)
                .subtotal(new BigDecimal("50.00"))
                .tax(new BigDecimal("6.00"))
                .totalAmount(new BigDecimal("56.00"))
                .build();

        Order cancelledOrder = Order.builder()
                .orderNumber("ORD-CANCELLED-02")
                .customer(customer)
                .status(OrderStatus.CANCELLED)
                .paymentMethod(PaymentMethod.CASH)
                .subtotal(new BigDecimal("100.00"))
                .tax(new BigDecimal("12.00"))
                .totalAmount(new BigDecimal("112.00"))
                .build();

        orderRepository.save(confirmedOrder);
        orderRepository.save(cancelledOrder);

        LocalDateTime now = LocalDateTime.now();
        BigDecimal revenue = orderRepository.calculateTotalRevenueBetween(now.minusHours(1), now.plusHours(1));

        assertThat(revenue).isEqualByComparingTo(new BigDecimal("56.00"));
    }
}
