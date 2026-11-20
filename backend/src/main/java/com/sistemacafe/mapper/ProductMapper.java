package com.sistemacafe.mapper;

import com.sistemacafe.domain.model.Product;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    private static final int LOW_STOCK_THRESHOLD = 10;

    public Product toEntity(ProductRequestDto dto) {
        if (dto == null) return null;
        return Product.builder()
                .sku(dto.getSku().toUpperCase().trim())
                .name(dto.getName().trim())
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .origin(dto.getOrigin().trim())
                .altitudeMasl(dto.getAltitudeMasl())
                .processMethod(dto.getProcessMethod() != null ? dto.getProcessMethod().trim() : null)
                .roastLevel(dto.getRoastLevel())
                .flavorNotes(dto.getFlavorNotes() != null ? dto.getFlavorNotes().trim() : null)
                .imageUrl(dto.getImageUrl() != null ? dto.getImageUrl().trim() : null)
                .unitPrice(dto.getUnitPrice())
                .stockQuantity(dto.getStockQuantity())
                .category(dto.getCategory())
                .active(dto.isActive())
                .build();
    }

    public ProductResponseDto toResponseDto(Product entity) {
        if (entity == null) return null;
        return ProductResponseDto.builder()
                .id(entity.getId())
                .sku(entity.getSku())
                .name(entity.getName())
                .description(entity.getDescription())
                .origin(entity.getOrigin())
                .altitudeMasl(entity.getAltitudeMasl())
                .processMethod(entity.getProcessMethod())
                .roastLevel(entity.getRoastLevel())
                .flavorNotes(entity.getFlavorNotes())
                .imageUrl(entity.getImageUrl())
                .unitPrice(entity.getUnitPrice())
                .stockQuantity(entity.getStockQuantity())
                .category(entity.getCategory())
                .active(entity.isActive())
                .lowStock(entity.isLowStock(LOW_STOCK_THRESHOLD))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromDto(Product entity, ProductRequestDto dto) {
        if (entity == null || dto == null) return;
        entity.setSku(dto.getSku().toUpperCase().trim());
        entity.setName(dto.getName().trim());
        entity.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : null);
        entity.setOrigin(dto.getOrigin().trim());
        entity.setAltitudeMasl(dto.getAltitudeMasl());
        entity.setProcessMethod(dto.getProcessMethod() != null ? dto.getProcessMethod().trim() : null);
        entity.setRoastLevel(dto.getRoastLevel());
        entity.setFlavorNotes(dto.getFlavorNotes() != null ? dto.getFlavorNotes().trim() : null);
        entity.setImageUrl(dto.getImageUrl() != null ? dto.getImageUrl().trim() : null);
        entity.setUnitPrice(dto.getUnitPrice());
        entity.setStockQuantity(dto.getStockQuantity());
        entity.setCategory(dto.getCategory());
        entity.setActive(dto.isActive());
    }
}
