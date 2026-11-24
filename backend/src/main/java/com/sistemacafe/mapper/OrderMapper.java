package com.sistemacafe.mapper;

import com.sistemacafe.domain.model.Order;
import com.sistemacafe.domain.model.OrderItem;
import com.sistemacafe.dto.OrderItemResponseDto;
import com.sistemacafe.dto.OrderResponseDto;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public OrderResponseDto toResponseDto(Order order) {
        if (order == null) return null;

        List<OrderItemResponseDto> itemDtos = order.getItems() != null
                ? order.getItems().stream().map(this::toItemResponseDto).collect(Collectors.toList())
                : Collections.emptyList();

        String tier = "BRONZE";
        if (order.getCustomer() != null && order.getCustomer().getTier() != null) {
            tier = order.getCustomer().getTier().name();
        }

        int earnedPoints = order.getTotalAmount() != null ? order.getTotalAmount().intValue() : 0;

        return OrderResponseDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .customerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                .customerTier(tier)
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .discount(order.getDiscount())
                .totalAmount(order.getTotalAmount())
                .loyaltyPointsEarned(earnedPoints)
                .notes(order.getNotes())
                .items(itemDtos)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public OrderItemResponseDto toItemResponseDto(OrderItem item) {
        if (item == null) return null;
        return OrderItemResponseDto.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productSku(item.getProduct() != null ? item.getProduct().getSku() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotalAmount(item.getSubtotalAmount())
                .build();
    }
}
