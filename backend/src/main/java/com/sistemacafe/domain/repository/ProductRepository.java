package com.sistemacafe.domain.repository;

import com.sistemacafe.domain.enums.ProductCategory;
import com.sistemacafe.domain.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    Page<Product> findByCategory(ProductCategory category, Pageable pageable);

    List<Product> findByStockQuantityLessThanEqualAndActiveTrue(Integer threshold);

    Page<Product> findByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " (p.description IS NOT NULL AND LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);
}
