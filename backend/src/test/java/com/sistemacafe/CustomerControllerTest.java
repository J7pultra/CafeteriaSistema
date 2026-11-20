package com.sistemacafe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sistemacafe.controller.CustomerController;
import com.sistemacafe.domain.enums.CustomerTier;
import com.sistemacafe.dto.CustomerRequestDto;
import com.sistemacafe.dto.CustomerResponseDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.exception.ResourceNotFoundException;
import com.sistemacafe.service.CustomerService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CustomerController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    @Test
    @DisplayName("POST /api/v1/customers - Debe retornar 201 Created al crear cliente válido")
    void shouldReturn201WhenCreatingValidCustomer() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .firstName("Paola")
                .lastName("García")
                .email("paola.garcia@specialty.ec")
                .phone("+593991122334")
                .address("La Pradera, Quito")
                .build();

        CustomerResponseDto response = CustomerResponseDto.builder()
                .id(1L)
                .firstName("Paola")
                .lastName("García")
                .fullName("Paola García")
                .email("paola.garcia@specialty.ec")
                .loyaltyPoints(0)
                .tier(CustomerTier.BRONZE)
                .active(true)
                .build();

        when(customerService.createCustomer(any(CustomerRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("paola.garcia@specialty.ec"))
                .andExpect(jsonPath("$.fullName").value("Paola García"));
    }

    @Test
    @DisplayName("POST /api/v1/customers - Debe retornar 400 Bad Request cuando el email es inválido")
    void shouldReturn400WhenEmailIsInvalid() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .firstName("Paola")
                .lastName("García")
                .email("email-no-valido") // Formato de email incorrecto
                .build();

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    @DisplayName("POST /api/v1/customers - Debe retornar 422 Unprocessable Entity si el email ya existe")
    void shouldReturn422WhenEmailAlreadyExists() throws Exception {
        CustomerRequestDto request = CustomerRequestDto.builder()
                .firstName("Paola")
                .lastName("García")
                .email("paola.duplicado@specialty.ec")
                .build();

        when(customerService.createCustomer(any(CustomerRequestDto.class)))
                .thenThrow(new BusinessRuleException("Ya existe un cliente registrado con el correo"));

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.message").value("Ya existe un cliente registrado con el correo"));
    }

    @Test
    @DisplayName("GET /api/v1/customers/{id} - Debe retornar 404 cuando el cliente no existe")
    void shouldReturn404WhenCustomerNotFound() throws Exception {
        when(customerService.getCustomerById(eq(999L)))
                .thenThrow(new ResourceNotFoundException("Cliente", "id", 999L));

        mockMvc.perform(get("/api/v1/customers/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
