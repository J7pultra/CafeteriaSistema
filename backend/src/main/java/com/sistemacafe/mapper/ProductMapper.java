package com.sistemacafe.mapper;

import com.sistemacafe.domain.model.Product;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class ProductMapper {

    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final String DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80";

    public Product toEntity(ProductRequestDto dto) {
        if (dto == null) {
            return null;
        }

        String sku = (dto.getSku() != null && !dto.getSku().isBlank())
                ? dto.getSku().toUpperCase().trim()
                : generateCleanSku(dto.getName());

        String imageUrl = (dto.getImageUrl() != null && !dto.getImageUrl().isBlank())
                ? dto.getImageUrl().trim()
                : DEFAULT_PRODUCT_IMAGE;

        BigDecimal price = dto.getUnitPrice() != null ? dto.getUnitPrice() : dto.getPrice();

        return Product.builder()
                .sku(sku)
                .name(dto.getName() != null ? dto.getName().trim() : "")
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .category(dto.getCategory())
                .unitPrice(price)
                .stockQuantity(dto.getStockQuantity() != null ? dto.getStockQuantity() : 0)
                .imageUrl(imageUrl)
                .active(dto.isActive())
                .build();
    }

    public ProductResponseDto toResponseDto(Product entity) {
        if (entity == null) {
            return null;
        }

        String imageUrl = (entity.getImageUrl() != null && !entity.getImageUrl().isBlank())
                ? entity.getImageUrl()
                : DEFAULT_PRODUCT_IMAGE;

        return ProductResponseDto.builder()
                .id(entity.getId())
                .sku(entity.getSku())
                .name(entity.getName())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .unitPrice(entity.getUnitPrice())
                .stockQuantity(entity.getStockQuantity())
                .imageUrl(imageUrl)
                .active(entity.isActive())
                .lowStock(entity.isLowStock(LOW_STOCK_THRESHOLD))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromDto(Product entity, ProductRequestDto dto) {
        if (entity == null || dto == null) {
            return;
        }

        if (dto.getSku() != null && !dto.getSku().isBlank()) {
            entity.setSku(dto.getSku().toUpperCase().trim());
        }
        if (dto.getName() != null) {
            entity.setName(dto.getName().trim());
        }
        entity.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : null);
        if (dto.getCategory() != null) {
            entity.setCategory(dto.getCategory());
        }

        BigDecimal price = dto.getUnitPrice() != null ? dto.getUnitPrice() : dto.getPrice();
        if (price != null) {
            entity.setUnitPrice(price);
        }

        if (dto.getStockQuantity() != null) {
            entity.setStockQuantity(dto.getStockQuantity());
        }

        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
            entity.setImageUrl(dto.getImageUrl().trim());
        }
        entity.setActive(dto.isActive());
    }

    private String generateCleanSku(String productName) {
        String prefix = "PRD";
        if (productName != null && productName.length() >= 3) {
            prefix = productName.substring(0, 3).toUpperCase().replaceAll("[^A-Z]", "CAF");
        }
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
