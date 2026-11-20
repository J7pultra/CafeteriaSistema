package com.sistemacafe.mapper;

import com.sistemacafe.domain.model.Customer;
import com.sistemacafe.dto.CustomerRequestDto;
import com.sistemacafe.dto.CustomerResponseDto;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    public Customer toEntity(CustomerRequestDto dto) {
        if (dto == null) return null;
        return Customer.builder()
                .firstName(dto.getFirstName().trim())
                .lastName(dto.getLastName().trim())
                .email(dto.getEmail().toLowerCase().trim())
                .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                .address(dto.getAddress() != null ? dto.getAddress().trim() : null)
                .active(true)
                .build();
    }

    public CustomerResponseDto toResponseDto(Customer entity) {
        if (entity == null) return null;
        return CustomerResponseDto.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .loyaltyPoints(entity.getLoyaltyPoints())
                .tier(entity.getTier())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromDto(Customer entity, CustomerRequestDto dto) {
        if (entity == null || dto == null) return;
        entity.setFirstName(dto.getFirstName().trim());
        entity.setLastName(dto.getLastName().trim());
        entity.setEmail(dto.getEmail().toLowerCase().trim());
        entity.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
        entity.setAddress(dto.getAddress() != null ? dto.getAddress().trim() : null);
    }
}
