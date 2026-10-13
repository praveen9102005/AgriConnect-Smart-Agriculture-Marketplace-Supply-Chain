package com.agrimart.service;

import com.agrimart.dto.ProductCreateRequest;
import com.agrimart.dto.ProductDto;
import com.agrimart.entity.Farmer;
import com.agrimart.entity.Product;
import com.agrimart.exception.BadRequestException;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.FarmerRepository;
import com.agrimart.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final FarmerRepository farmerRepository;

    public ProductService(ProductRepository productRepository, FarmerRepository farmerRepository) {
        this.productRepository = productRepository;
        this.farmerRepository = farmerRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductDto> getProductsWithFilters(String category, String search, Double minPrice, Double maxPrice, Double minRating, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(nameLike, descLike));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> products = productRepository.findAll(spec, pageable);
        return products.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToDto(product);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByFarmer(Long farmerId) {
        return productRepository.findByFarmerId(farmerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getFeaturedProducts() {
        return productRepository.findTop8ByOrderByRatingDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto createProduct(ProductCreateRequest request, Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        Product product = new Product(
                request.getName(),
                request.getCategory(),
                request.getDescription(),
                request.getImageUrl() != null && !request.getImageUrl().isBlank()
                        ? request.getImageUrl()
                        : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
                request.getPrice(),
                request.getOriginalPrice() != null ? request.getOriginalPrice() : request.getPrice() * 1.15,
                request.getUnit(),
                request.getStock(),
                4.8,
                1,
                request.getDelivery() != null ? request.getDelivery() : "Standard (2-3 days)",
                farmer
        );

        product = productRepository.save(product);
        return mapToDto(product);
    }

    public ProductDto updateProduct(Long id, ProductCreateRequest request, Long farmerId, boolean isAdmin) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!isAdmin && (product.getFarmer() == null || !product.getFarmer().getId().equals(farmerId))) {
            throw new BadRequestException("You can only modify your own products");
        }

        product.setName(request.getName());
        product.setCategory(request.getCategory());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) product.setImageUrl(request.getImageUrl());
        product.setPrice(request.getPrice());
        if (request.getOriginalPrice() != null) product.setOriginalPrice(request.getOriginalPrice());
        product.setUnit(request.getUnit());
        product.setStock(request.getStock());
        if (request.getDelivery() != null) product.setDelivery(request.getDelivery());

        product = productRepository.save(product);
        return mapToDto(product);
    }

    public void deleteProduct(Long id, Long farmerId, boolean isAdmin) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!isAdmin && (product.getFarmer() == null || !product.getFarmer().getId().equals(farmerId))) {
            throw new BadRequestException("You can only delete your own products");
        }

        productRepository.delete(product);
    }

    public ProductDto updateStock(Long productId, int newStock) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        product.setStock(newStock);
        product = productRepository.save(product);
        return mapToDto(product);
    }

    public ProductDto mapToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCategory(product.getCategory());
        dto.setDescription(product.getDescription());
        dto.setImageUrl(product.getImageUrl());
        dto.setPrice(product.getPrice());
        dto.setOriginalPrice(product.getOriginalPrice());
        dto.setUnit(product.getUnit());
        dto.setStock(product.getStock());
        dto.setRating(product.getRating());
        dto.setReviews(product.getReviews());
        dto.setDelivery(product.getDelivery());

        if (product.getFarmer() != null) {
            dto.setFarmerId(product.getFarmer().getId());
            dto.setFarmerName(product.getFarmerName() != null ? product.getFarmerName() : product.getFarmer().getName());
        } else {
            dto.setFarmerId(1L);
            dto.setFarmerName(product.getFarmerName() != null ? product.getFarmerName() : "Verified Regional Farmer");
        }

        dto.setCreatedAt(product.getCreatedAt());
        return dto;
    }
}
