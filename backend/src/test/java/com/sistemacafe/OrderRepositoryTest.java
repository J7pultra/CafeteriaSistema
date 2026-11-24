package com.sistemacafe;

import com.sistemacafe.config.AuditConfig;
import com.sistemacafe.domain.enums.CustomerTier;
import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.domain.enums.PaymentMethod;
import com.sistemacafe.domain.enums.ProductCategory;
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
        Customer customer = customerRepository.save(Customer.builder()
                .firstName("Mateo")
                .lastName("Morales")
                .email("mateo.morales@coffeelover.com")
                .tier(CustomerTier.GOLD)
                .build());

        Product product = productRepository.save(Product.builder()
                .sku("CAF-CAP-001")
                .name("Cappuccino Italiano")
                .unitPrice(new BigDecimal("4.00"))
                .stockQuantity(100)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .build());

        Order order = Order.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .status(OrderStatus.CONFIRMADO)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .notes("Con leche descremada")
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(2)
                .unitPrice(product.getUnitPrice())
                .build();
        item.calculateSubtotal(); // 2 * 4.00 = 8.00

        order.addItem(item);

        Order savedOrder = orderRepository.save(order);

        assertThat(savedOrder.getId()).isNotNull();
        assertThat(savedOrder.getItems()).hasSize(1);
        assertThat(savedOrder.getSubtotal()).isEqualByComparingTo(new BigDecimal("8.00"));
        assertThat(savedOrder.getTax()).isEqualByComparingTo(new BigDecimal("0.96")); // 12% de 8.00
        assertThat(savedOrder.getTotalAmount()).isEqualByComparingTo(new BigDecimal("8.96"));
    }

    @Test
    @DisplayName("Debe calcular ingresos de órdenes excluyendo las canceladas")
    void shouldCalculateTotalRevenueExcludingCancelled() {
        Customer customer = customerRepository.save(Customer.builder()
                .firstName("Ana")
                .lastName("Gómez")
                .email("ana.gomez@test.com")
                .tier(CustomerTier.BRONZE)
                .build());

        Product product = productRepository.save(Product.builder()
                .sku("CAF-AME-002")
                .name("Americano")
                .unitPrice(new BigDecimal("2.50"))
                .stockQuantity(50)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .build());

        Order o1 = Order.builder()
                .orderNumber("ORD-REV-01")
                .customer(customer)
                .status(OrderStatus.CONFIRMADO)
                .paymentMethod(PaymentMethod.CASH)
                .build();
        OrderItem i1 = OrderItem.builder().product(product).quantity(2).unitPrice(product.getUnitPrice()).build();
        i1.calculateSubtotal();
        o1.addItem(i1);

        Order o2 = Order.builder()
                .orderNumber("ORD-REV-02")
                .customer(customer)
                .status(OrderStatus.CANCELADO)
                .paymentMethod(PaymentMethod.CASH)
                .build();
        OrderItem i2 = OrderItem.builder().product(product).quantity(4).unitPrice(product.getUnitPrice()).build();
        i2.calculateSubtotal();
        o2.addItem(i2);

        orderRepository.save(o1);
        orderRepository.save(o2);

        BigDecimal revenue = orderRepository.calculateTotalRevenue(OrderStatus.CANCELADO);
        assertThat(revenue).isEqualByComparingTo(o1.getTotalAmount());
    }
}
