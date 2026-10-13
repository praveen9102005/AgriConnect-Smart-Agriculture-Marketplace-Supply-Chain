package com.agrimart.repository;

import com.agrimart.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    List<OrderItem> findByFarmerId(Long farmerId);

    @Query("SELECT oi.productName, SUM(oi.quantity), SUM(oi.price * oi.quantity) FROM OrderItem oi GROUP BY oi.productName ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts();

    @Query("SELECT oi.farmerId, SUM(oi.price * oi.quantity) FROM OrderItem oi GROUP BY oi.farmerId")
    List<Object[]> findRevenueByFarmer();
}
