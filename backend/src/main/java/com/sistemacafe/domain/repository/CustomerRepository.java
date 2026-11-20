package com.sistemacafe.domain.repository;

import com.sistemacafe.domain.enums.CustomerTier;
import com.sistemacafe.domain.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<Customer> findByActiveTrue(Pageable pageable);

    List<Customer> findByTier(CustomerTier tier);

    @Query("SELECT c FROM Customer c WHERE c.active = true AND " +
           "(LOWER(c.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Customer> searchCustomers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt >= :startDate AND c.createdAt <= :endDate")
    long countCustomersCreatedBetween(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);
}
