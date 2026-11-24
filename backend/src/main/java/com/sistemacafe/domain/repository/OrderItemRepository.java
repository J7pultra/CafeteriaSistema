package com.sistemacafe.domain.repository;

import com.sistemacafe.domain.enums.OrderStatus;
import com.sistemacafe.domain.model.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    List<OrderItem> findByProductId(Long productId);

    @Query("SELECT oi.product.category, COALESCE(SUM(oi.subtotalAmount), 0) " +
           "FROM OrderItem oi WHERE oi.order.status != :cancelledStatus " +
           "GROUP BY oi.product.category")
    List<Object[]> sumSalesByCategory(@Param("cancelledStatus") OrderStatus cancelledStatus);

    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity), SUM(oi.subtotalAmount) " +
           "FROM OrderItem oi WHERE oi.order.status != :cancelledStatus " +
           "GROUP BY oi.product.id, oi.product.name ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(@Param("cancelledStatus") OrderStatus cancelledStatus, Pageable pageable);
}
