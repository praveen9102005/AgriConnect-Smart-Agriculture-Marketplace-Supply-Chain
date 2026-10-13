package com.agrimart.controller;

import com.agrimart.dto.ProductCreateRequest;
import com.agrimart.dto.ProductDto;
import com.agrimart.entity.Farmer;
import com.agrimart.entity.Role;
import com.agrimart.entity.User;
import com.agrimart.exception.BadRequestException;
import com.agrimart.repository.FarmerRepository;
import com.agrimart.repository.UserRepository;
import com.agrimart.security.SecurityUtils;
import com.agrimart.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;

    public ProductController(ProductService productService,
                             UserRepository userRepository,
                             FarmerRepository farmerRepository) {
        this.productService = productService;
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
    }

    @GetMapping
    public ResponseEntity<Page<ProductDto>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Page<ProductDto> products = productService.getProductsWithFilters(
                category, search, minPrice, maxPrice, minRating, page, size, sortBy, sortDir);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/featured")
    public ResponseEntity<List<ProductDto>> getFeaturedProducts() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<ProductDto>> getProductsByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(productService.getProductsByFarmer(farmerId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductCreateRequest request,
                                                    @RequestParam(required = false) Long farmerId) {
        Long resolvedFarmerId = resolveFarmerId(farmerId);
        ProductDto created = productService.createProduct(request, resolvedFarmerId);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id,
                                                    @Valid @RequestBody ProductCreateRequest request,
                                                    @RequestParam(required = false) Long farmerId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() == Role.ADMIN;
        Long resolvedFarmerId = resolveFarmerId(farmerId);

        ProductDto updated = productService.updateProduct(id, request, resolvedFarmerId, isAdmin);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id,
                                              @RequestParam(required = false) Long farmerId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() == Role.ADMIN;
        Long resolvedFarmerId = resolveFarmerId(farmerId);

        productService.deleteProduct(id, resolvedFarmerId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<ProductDto> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> stockPayload) {
        Integer newStock = stockPayload.get("stock");
        if (newStock == null) {
            throw new BadRequestException("Stock value is required");
        }
        ProductDto updated = productService.updateStock(id, newStock);
        return ResponseEntity.ok(updated);
    }

    private Long resolveFarmerId(Long providedFarmerId) {
        if (providedFarmerId != null) {
            return providedFarmerId;
        }
        String email = SecurityUtils.getCurrentUserEmail();
        if (email != null) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                return farmerRepository.findByUserId(user.getId())
                        .map(Farmer::getId)
                        .orElse(1L);
            }
        }
        return 1L;
    }
}
