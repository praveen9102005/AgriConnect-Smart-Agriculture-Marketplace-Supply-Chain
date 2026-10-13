package com.agrimart.repository;

import com.agrimart.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByFarmerId(Long farmerId);
    Page<Product> findByFarmerId(Long farmerId, Pageable pageable);

    List<Product> findTop8ByOrderByRatingDesc();

    List<Product> findByCategoryIgnoreCase(String category);

    @Query("SELECT p FROM Product p WHERE LOWER(p.category) = LOWER(:category) AND p.id != :id")
    List<Product> findSimilarProducts(@Param("category") String category, @Param("id") Long id, Pageable pageable);

    long countByCategoryIgnoreCase(String category);

    long countByStockLessThan(int threshold);

    @Query("SELECT p.category, COUNT(p) FROM Product p GROUP BY p.category")
    List<Object[]> countProductsByCategory();
}
