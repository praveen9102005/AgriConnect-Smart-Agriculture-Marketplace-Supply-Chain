package com.agrimart.controller;

import com.agrimart.dto.OrderDto;
import com.agrimart.dto.OrderRequest;
import com.agrimart.dto.OrderStatusUpdateRequest;
import com.agrimart.entity.User;
import com.agrimart.exception.BadRequestException;
import com.agrimart.repository.UserRepository;
import com.agrimart.security.SecurityUtils;
import com.agrimart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody OrderRequest request) {
        Long customerId = getCurrentUserId();
        OrderDto created = orderService.createOrder(customerId, request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS')")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        Long customerId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getOrdersForCustomer(customerId));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<OrderDto>> getOrdersForFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(orderService.getOrdersForFarmer(farmerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderDto updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            throw new BadRequestException("User is not authenticated");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return user.getId();
    }
}
