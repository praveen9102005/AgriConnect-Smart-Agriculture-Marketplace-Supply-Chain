package com.agrimart.repository;

import com.agrimart.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findByStatus(String status);
    List<Delivery> findAllByOrderByUpdatedAtDesc();
    long countByStatus(String status);
}
