package com.sistemacafe.service;

import com.sistemacafe.domain.model.Customer;
import com.sistemacafe.domain.repository.CustomerRepository;
import com.sistemacafe.dto.CustomerRequestDto;
import com.sistemacafe.dto.CustomerResponseDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.exception.ResourceNotFoundException;
import com.sistemacafe.mapper.CustomerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Transactional
    @CacheEvict(value = "dashboard_metrics", allEntries = true)
    public CustomerResponseDto createCustomer(CustomerRequestDto requestDto) {
        String normalizedEmail = requestDto.getEmail().toLowerCase().trim();
        if (customerRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessRuleException("Ya existe un cliente registrado con el correo: " + normalizedEmail);
        }

        Customer customer = customerMapper.toEntity(requestDto);
        Customer saved = customerRepository.save(customer);
        return customerMapper.toResponseDto(saved);
    }

    @Transactional
    @CacheEvict(value = "dashboard_metrics", allEntries = true)
    public CustomerResponseDto updateCustomer(Long id, CustomerRequestDto requestDto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));

        String normalizedEmail = requestDto.getEmail().toLowerCase().trim();
        if (!customer.getEmail().equalsIgnoreCase(normalizedEmail) && customerRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessRuleException("El correo " + normalizedEmail + " ya está en uso por otro cliente.");
        }

        customerMapper.updateEntityFromDto(customer, requestDto);
        Customer updated = customerRepository.save(customer);
        return customerMapper.toResponseDto(updated);
    }

    @Transactional(readOnly = true)
    public CustomerResponseDto getCustomerById(Long id) {
        return customerRepository.findById(id)
                .map(customerMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
    }

    @Transactional(readOnly = true)
    public CustomerResponseDto getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email.toLowerCase().trim())
                .map(customerMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "email", email));
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponseDto> getAllCustomers(Pageable pageable) {
        return customerRepository.findByActiveTrue(pageable)
                .map(customerMapper::toResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponseDto> searchCustomers(String keyword, Pageable pageable) {
        return customerRepository.searchCustomers(keyword, pageable)
                .map(customerMapper::toResponseDto);
    }

    @Transactional
    @CacheEvict(value = "dashboard_metrics", allEntries = true)
    public void deactivateCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
        customer.setActive(false);
        customerRepository.save(customer);
    }

    @Transactional
    @CacheEvict(value = "dashboard_metrics", allEntries = true)
    public CustomerResponseDto addLoyaltyPoints(Long id, int points) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
        customer.addLoyaltyPoints(points);
        Customer saved = customerRepository.save(customer);
        return customerMapper.toResponseDto(saved);
    }
}
