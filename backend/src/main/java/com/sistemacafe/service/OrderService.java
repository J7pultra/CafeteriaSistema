package com.sistemacafe.service;

import com.sistemacafe.domain.enums.OrderStatus;
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
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.exception.ResourceNotFoundException;
import com.sistemacafe.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;

    private static final BigDecimal DEFAULT_TAX_RATE = BigDecimal.valueOf(0.12); // 12% IVA

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "product_detail", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public OrderResponseDto createOrder(OrderCreateRequestDto requestDto) {
        Customer customer = customerRepository.findById(requestDto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", requestDto.getCustomerId()));

        if (!customer.isActive()) {
            throw new BusinessRuleException("No se pueden procesar órdenes para un cliente inactivo.");
        }

        if (requestDto.getItems() == null || requestDto.getItems().isEmpty()) {
            throw new BusinessRuleException("La orden debe contener al menos un producto.");
        }

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .status(OrderStatus.CONFIRMADO)
                .paymentMethod(requestDto.getPaymentMethod())
                .notes(requestDto.getNotes() != null ? requestDto.getNotes().trim() : null)
                .build();

        for (OrderItemRequestDto itemDto : requestDto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", itemDto.getProductId()));

            if (!product.isActive()) {
                throw new BusinessRuleException("El producto " + product.getName() + " está inactivo en catálogo.");
            }

            product.reduceStock(itemDto.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .unitPrice(product.getUnitPrice())
                    .build();
            orderItem.calculateSubtotal();

            order.addItem(orderItem);
        }

        order.recalculateTotals(DEFAULT_TAX_RATE);

        int earnedPoints = order.getTotalAmount().intValue();
        if (earnedPoints > 0) {
            customer.addLoyaltyPoints(earnedPoints);
            customerRepository.save(customer);
        }

        Order savedOrder = orderRepository.save(order);
        return orderMapper.toResponseDto(savedOrder);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "product_detail", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public OrderResponseDto processGuestCheckout(com.sistemacafe.dto.GuestCheckoutRequestDto dto) {
        String email = dto.getEmail().toLowerCase().trim();
        Customer customer = customerRepository.findByEmail(email).orElseGet(() -> {
            String[] parts = dto.getFullName().trim().split("\\s+", 2);
            String firstName = parts[0];
            String lastName = parts.length > 1 ? parts[1] : "Cliente";
            return customerRepository.save(Customer.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                    .tier(com.sistemacafe.domain.enums.CustomerTier.BRONZE)
                    .loyaltyPoints(0)
                    .active(true)
                    .build());
        });

        OrderCreateRequestDto orderDto = OrderCreateRequestDto.builder()
                .customerId(customer.getId())
                .paymentMethod(dto.getPaymentMethod())
                .notes(dto.getNotes())
                .items(dto.getItems())
                .build();

        return createOrder(orderDto);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long id) {
        return orderRepository.findById(id)
                .map(orderMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", "id", id));
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .map(orderMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", "orderNumber", orderNumber));
    }

    @Transactional(readOnly = true)
    public Page<OrderResponseDto> getAllOrders(OrderStatus status, Pageable pageable) {
        if (status != null) {
            return orderRepository.findByStatus(status, pageable).map(orderMapper::toResponseDto);
        }
        return orderRepository.findAll(pageable).map(orderMapper::toResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponseDto> getOrdersByCustomer(Long customerId, Pageable pageable) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Cliente", "id", customerId);
        }
        return orderRepository.findByCustomerId(customerId, pageable).map(orderMapper::toResponseDto);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "product_detail", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public OrderResponseDto updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", "id", id));

        OrderStatus current = order.getStatus();
        OrderStatus normCurrent = normalizeStatus(current);
        OrderStatus normNew = normalizeStatus(newStatus);

        if (normCurrent == OrderStatus.CANCELADO) {
            throw new BusinessRuleException("No se puede modificar el estado de una orden cancelada.");
        }

        if (normCurrent == OrderStatus.ENTREGADO && normNew != OrderStatus.ENTREGADO) {
            throw new BusinessRuleException("Una orden ya entregada no puede cambiar de estado.");
        }

        if (normNew == OrderStatus.CANCELADO) {
            return cancelOrderInternal(order);
        }

        if (!isValidStatusTransition(normCurrent, normNew)) {
            throw new BusinessRuleException(
                String.format("Transición de estado no permitida: de %s a %s. El flujo válido es: PENDIENTE -> CONFIRMADO -> EN_PREPARACION -> LISTO -> ENTREGADO",
                        current, newStatus)
            );
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        return orderMapper.toResponseDto(updated);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "product_detail", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public OrderResponseDto cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", "id", id));
        return cancelOrderInternal(order);
    }

    private OrderResponseDto cancelOrderInternal(Order order) {
        OrderStatus current = normalizeStatus(order.getStatus());
        if (current == OrderStatus.CANCELADO) {
            throw new BusinessRuleException("La orden ya se encuentra cancelada.");
        }
        if (current == OrderStatus.ENTREGADO) {
            throw new BusinessRuleException("No se puede cancelar una orden que ya ha sido entregada.");
        }

        // Devolución de stock al inventario
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.addStock(item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(OrderStatus.CANCELADO);
        Order updated = orderRepository.save(order);
        return orderMapper.toResponseDto(updated);
    }

    private boolean isValidStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == next) return true;
        if (next == OrderStatus.CANCELADO) return true;

        return switch (current) {
            case PENDIENTE -> next == OrderStatus.CONFIRMADO;
            case CONFIRMADO -> next == OrderStatus.EN_PREPARACION;
            case EN_PREPARACION -> next == OrderStatus.LISTO;
            case LISTO -> next == OrderStatus.ENTREGADO;
            default -> false;
        };
    }

    private OrderStatus normalizeStatus(OrderStatus status) {
        if (status == null) return OrderStatus.PENDIENTE;
        return switch (status) {
            case PENDING, PENDIENTE -> OrderStatus.PENDIENTE;
            case CONFIRMED, CONFIRMADO -> OrderStatus.CONFIRMADO;
            case PREPARING, EN_PREPARACION -> OrderStatus.EN_PREPARACION;
            case READY_FOR_PICKUP, LISTO -> OrderStatus.LISTO;
            case IN_DELIVERY, DELIVERED, ENTREGADO -> OrderStatus.ENTREGADO;
            case CANCELLED, CANCELADO -> OrderStatus.CANCELADO;
        };
    }
}
