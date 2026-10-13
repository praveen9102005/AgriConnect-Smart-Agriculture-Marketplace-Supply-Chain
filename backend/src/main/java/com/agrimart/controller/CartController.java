package com.agrimart.controller;

import com.agrimart.dto.AddToCartRequest;
import com.agrimart.dto.CartDto;
import com.agrimart.entity.User;
import com.agrimart.exception.BadRequestException;
import com.agrimart.repository.UserRepository;
import com.agrimart.security.SecurityUtils;
import com.agrimart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(CartService cartService, UserRepository userRepository) {
        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<CartDto> getCart() {
        Long customerId = getCurrentCustomerId();
        return ResponseEntity.ok(cartService.getCartDto(customerId));
    }

    @PostMapping("/add")
    public ResponseEntity<CartDto> addToCart(@Valid @RequestBody AddToCartRequest request) {
        Long customerId = getCurrentCustomerId();
        return ResponseEntity.ok(cartService.addToCart(customerId, request));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartDto> updateItemQuantity(@PathVariable Long itemId, @RequestBody Map<String, Integer> payload) {
        Long customerId = getCurrentCustomerId();
        Integer quantity = payload.get("quantity");
        if (quantity == null) {
            throw new BadRequestException("Quantity is required");
        }
        return ResponseEntity.ok(cartService.updateQuantity(customerId, itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartDto> removeItem(@PathVariable Long itemId) {
        Long customerId = getCurrentCustomerId();
        return ResponseEntity.ok(cartService.removeItem(customerId, itemId));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart() {
        Long customerId = getCurrentCustomerId();
        cartService.clearCart(customerId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentCustomerId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            throw new BadRequestException("User is not authenticated");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Customer not found"));
        return user.getId();
    }
}
