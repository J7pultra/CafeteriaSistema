package com.sistemacafe.service;

import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.model.Product;
import com.sistemacafe.domain.repository.ProductRepository;
import com.sistemacafe.dto.ProductRequestDto;
import com.sistemacafe.dto.ProductResponseDto;
import com.sistemacafe.dto.ProductStockUpdateDto;
import com.sistemacafe.exception.BusinessRuleException;
import com.sistemacafe.exception.ResourceNotFoundException;
import com.sistemacafe.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 10;

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public ProductResponseDto createProduct(ProductRequestDto requestDto) {
        if (requestDto.getSku() != null && !requestDto.getSku().isBlank()) {
            String normalizedSku = requestDto.getSku().toUpperCase().trim();
            if (productRepository.existsBySku(normalizedSku)) {
                throw new BusinessRuleException("Ya existe un producto registrado con el SKU: " + normalizedSku);
            }
            requestDto.setSku(normalizedSku);
        } else {
            String autoSku = "PRD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            while (productRepository.existsBySku(autoSku)) {
                autoSku = "PRD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            }
            requestDto.setSku(autoSku);
        }

        Product product = productMapper.toEntity(requestDto);
        Product saved = productRepository.save(product);
        return productMapper.toResponseDto(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product_detail", key = "'id:' + #id"),
            @CacheEvict(value = "product_detail", key = "'sku:' + #requestDto.sku != null ? #requestDto.sku.toUpperCase().trim() : ''"),
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public ProductResponseDto updateProduct(Long id, ProductRequestDto requestDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));

        if (requestDto.getSku() != null && !requestDto.getSku().isBlank()) {
            String normalizedSku = requestDto.getSku().toUpperCase().trim();
            if (!product.getSku().equalsIgnoreCase(normalizedSku) && productRepository.existsBySku(normalizedSku)) {
                throw new BusinessRuleException("El SKU " + normalizedSku + " ya pertenece a otro producto en catálogo.");
            }
        }

        productMapper.updateEntityFromDto(product, requestDto);
        Product updated = productRepository.save(product);
        return productMapper.toResponseDto(updated);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "product_detail", key = "'id:' + #id")
    public ProductResponseDto getProductById(Long id) {
        return productRepository.findById(id)
                .map(productMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "product_detail", key = "'sku:' + #sku.toUpperCase().trim()")
    public ProductResponseDto getProductBySku(String sku) {
        return productRepository.findBySku(sku.toUpperCase().trim())
                .map(productMapper::toResponseDto)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "sku", sku));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDto> getAllProducts(ProductCategory category, Pageable pageable) {
        if (category != null) {
            return productRepository.findByCategory(category, pageable).map(productMapper::toResponseDto);
        }
        return productRepository.findByActiveTrue(pageable).map(productMapper::toResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDto> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchProducts(keyword, pageable).map(productMapper::toResponseDto);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product_detail", key = "'id:' + #id"),
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public ProductResponseDto updateStock(Long id, ProductStockUpdateDto stockUpdateDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));

        if (stockUpdateDto.getOperation() == ProductStockUpdateDto.StockOperation.ADD) {
            product.addStock(stockUpdateDto.getQuantity());
        } else if (stockUpdateDto.getOperation() == ProductStockUpdateDto.StockOperation.REDUCE) {
            product.reduceStock(stockUpdateDto.getQuantity());
        }

        Product saved = productRepository.save(product);
        return productMapper.toResponseDto(saved);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "low_stock_products", key = "#threshold != null ? #threshold : 10")
    public List<ProductResponseDto> getLowStockProducts(Integer threshold) {
        int effectiveThreshold = threshold != null ? threshold : DEFAULT_LOW_STOCK_THRESHOLD;
        return productRepository.findByStockQuantityLessThanEqualAndActiveTrue(effectiveThreshold)
                .stream()
                .map(productMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product_detail", key = "'id:' + #id"),
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "low_stock_products", allEntries = true),
            @CacheEvict(value = "dashboard_metrics", allEntries = true)
    })
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
        product.setActive(false);
        productRepository.save(product);
    }
}
