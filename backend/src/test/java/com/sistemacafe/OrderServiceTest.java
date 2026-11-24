package com.sistemacafe;

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
                .sku("CAF-LAT-01")
                .name("Café Latte")
                .unitPrice(new BigDecimal("3.50"))
                .stockQuantity(15)
                .category(ProductCategory.BEBIDAS_CALIENTES)
                .active(true)
                .build();

        createOrderDto = OrderCreateRequestDto.builder()
                .customerId(1L)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .notes("Con leche de almendras")
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
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getCustomerTier()).isEqualTo("BRONZE");
        assertThat(product.getStockQuantity()).isEqualTo(13); // 15 - 2 = 13
        verify(productRepository).save(product);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Debe cancelar orden y devolver el stock reservado")
    void shouldCancelOrderAndRestoreStock() {
        Order order = Order.builder()
                .id(50L)
                .orderNumber("ORD-CANCEL-TEST")
                .customer(customer)
                .status(OrderStatus.CONFIRMADO)
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(3)
                .unitPrice(product.getUnitPrice())
                .build();
        item.calculateSubtotal();
        order.addItem(item);

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponseDto cancelled = orderService.cancelOrder(50L);

        assertThat(cancelled).isNotNull();
        assertThat(cancelled.getStatus()).isEqualTo(OrderStatus.CANCELADO);
        assertThat(product.getStockQuantity()).isEqualTo(18); // 15 + 3 = 18
        verify(productRepository).save(product);
    }
}
