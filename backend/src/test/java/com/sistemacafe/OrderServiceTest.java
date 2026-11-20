package com.sistemacafe;

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
import com.sistemacafe.dto.OrderCreateRequestDto;
import com.sistemacafe.dto.OrderItemRequestDto;
import com.sistemacafe.dto.OrderResponseDto;
import com.sistemacafe.mapper.OrderMapper;
import com.sistemacafe.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Spy
    private OrderMapper orderMapper;

    @InjectMocks
    private OrderService orderService;

    private Customer customer;
    private Product product;
    private OrderCreateRequestDto createOrderDto;

    @BeforeEach
    void setUp() {
        customer = Customer.builder()
                .id(1L)
                .firstName("Lucía")
                .lastName("Mendoza")
                .email("lucia.mendoza@cafe.ec")
                .loyaltyPoints(100)
                .tier(CustomerTier.BRONZE)
                .active(true)
                .build();

        product = Product.builder()
                .id(10L)
                .sku("COF-SIDRA-01")
                .name("Variedad Sidra")
                .origin("Pichincha")
                .roastLevel(RoastLevel.LIGHT)
                .unitPrice(new BigDecimal("20.00"))
                .stockQuantity(15)
                .category(ProductCategory.SPECIALTY_BEANS)
                .active(true)
                .build();

        createOrderDto = OrderCreateRequestDto.builder()
                .customerId(1L)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .notes("Molienda media para V60")
                .items(List.of(
                        OrderItemRequestDto.builder()
                                .productId(10L)
                                .quantity(2)
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("Debe crear una orden descontando el inventario y calculando subtotales e impuestos")
    void shouldCreateOrderAndReduceStock() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(100L);
            return o;
        });

        OrderResponseDto response = orderService.createOrder(createOrderDto);

        assertThat(response).isNotNull();
        assertThat(product.getStockQuantity()).isEqualTo(13); // 15 - 2 = 13
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("40.00")); // 2 * 20.00
        assertThat(response.getTax()).isEqualByComparingTo(new BigDecimal("4.80")); // 12% de 40.00
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("44.80"));
        verify(productRepository).save(product);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción si el stock solicitado excede la disponibilidad")
    void shouldThrowExceptionWhenStockIsInsufficient() {
        createOrderDto.getItems().get(0).setQuantity(50); // pide 50 pero hay 15
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> orderService.createOrder(createOrderDto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Stock insuficiente");
    }

    @Test
    @DisplayName("Debe devolver el stock al inventario al cancelar una orden")
    void shouldRestoreStockWhenCancellingOrder() {
        Order order = Order.builder()
                .id(200L)
                .orderNumber("ORD-TEST-99")
                .customer(customer)
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.CASH)
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L)
                .order(order)
                .product(product)
                .quantity(3)
                .unitPrice(new BigDecimal("20.00"))
                .subtotalAmount(new BigDecimal("60.00"))
                .build();
        order.getItems().add(item);

        when(orderRepository.findById(200L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        orderService.cancelOrder(200L);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(product.getStockQuantity()).isEqualTo(18); // 15 + 3 = 18
        verify(productRepository).save(product);
    }
}
