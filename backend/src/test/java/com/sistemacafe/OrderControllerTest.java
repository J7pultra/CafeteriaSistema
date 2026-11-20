package com.sistemacafe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistemacafe.controller.OrderController;
import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.domain.enums.PaymentMethod;
import com.sistemacafe.dto.OrderCreateRequestDto;
import com.sistemacafe.dto.OrderItemRequestDto;
import com.sistemacafe.dto.OrderResponseDto;
import com.sistemacafe.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OrderController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/v1/orders - Debe crear orden con 201 Created")
    void shouldCreateOrderSuccessfully() throws Exception {
        OrderCreateRequestDto request = OrderCreateRequestDto.builder()
                .customerId(1L)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .notes("Por favor despachar por la mañana")
                .items(List.of(
                        OrderItemRequestDto.builder().productId(10L).quantity(2).build()
                ))
                .build();

        OrderResponseDto response = OrderResponseDto.builder()
                .id(100L)
                .orderNumber("ORD-8F3A29B1")
                .customerId(1L)
                .customerName("Carlos Valdez")
                .customerEmail("carlos.valdez@cafespecialty.com")
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .subtotal(new BigDecimal("30.00"))
                .tax(new BigDecimal("3.60"))
                .totalAmount(new BigDecimal("33.60"))
                .items(Collections.emptyList())
                .build();

        when(orderService.createOrder(any(OrderCreateRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.orderNumber").value("ORD-8F3A29B1"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.totalAmount").value(33.60));
    }

    @Test
    @DisplayName("POST /api/v1/orders - Debe retornar 400 cuando la lista de items está vacía")
    void shouldReturn400WhenItemsAreEmpty() throws Exception {
        OrderCreateRequestDto request = OrderCreateRequestDto.builder()
                .customerId(1L)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .items(Collections.emptyList())
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.items").exists());
    }
}
