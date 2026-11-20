package com.sistemacafe;

import com.sistemacafe.domain.model.Customer;
import com.sistemacafe.domain.repository.CustomerRepository;
import com.sistemacafe.dto.CustomerRequestDto;
import com.sistemacafe.dto.CustomerResponseDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.exception.ResourceNotFoundException;
import com.sistemacafe.mapper.CustomerMapper;
import com.sistemacafe.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Spy
    private CustomerMapper customerMapper;

    @InjectMocks
    private CustomerService customerService;

    private Customer customer;
    private CustomerRequestDto requestDto;

    @BeforeEach
    void setUp() {
        customer = Customer.builder()
                .id(1L)
                .firstName("Andrés")
                .lastName("López")
                .email("andres.lopez@cafecito.ec")
                .phone("+593987123456")
                .address("Calle 10 de Agosto, Cuenca")
                .active(true)
                .loyaltyPoints(150)
                .build();

        requestDto = CustomerRequestDto.builder()
                .firstName("Andrés")
                .lastName("López")
                .email("andres.lopez@cafecito.ec")
                .phone("+593987123456")
                .address("Calle 10 de Agosto, Cuenca")
                .build();
    }

    @Test
    @DisplayName("Debe crear cliente con éxito cuando el email no existe")
    void shouldCreateCustomerSuccessfully() {
        when(customerRepository.existsByEmail("andres.lopez@cafecito.ec")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);

        CustomerResponseDto response = customerService.createCustomer(requestDto);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("andres.lopez@cafecito.ec");
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    @DisplayName("Debe lanzar BusinessRuleException al intentar crear cliente con email existente")
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        when(customerRepository.existsByEmail("andres.lopez@cafecito.ec")).thenReturn(true);

        assertThatThrownBy(() -> customerService.createCustomer(requestDto))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Ya existe un cliente registrado");
    }

    @Test
    @DisplayName("Debe lanzar ResourceNotFoundException cuando no encuentra el cliente por ID")
    void shouldThrowExceptionWhenCustomerNotFound() {
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Cliente no encontrado");
    }
}
