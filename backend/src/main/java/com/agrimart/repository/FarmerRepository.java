package com.agrimart.repository;

import com.agrimart.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    Optional<Farmer> findByUserId(Long userId);
    List<Farmer> findByState(String state);
    List<Farmer> findTop8ByOrderByRatingDesc();
}
