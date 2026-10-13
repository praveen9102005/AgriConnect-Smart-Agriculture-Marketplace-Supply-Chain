package com.agrimart.service;

import com.agrimart.dto.OrderDto;
import com.agrimart.dto.OrderItemDto;
import com.agrimart.dto.OrderRequest;
import com.agrimart.entity.*;
import com.agrimart.exception.BadRequestException;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final NotificationRepository notificationRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository,
                        CartRepository cartRepository,
                        CartItemRepository cartItemRepository,
                        DeliveryRepository deliveryRepository,
                        NotificationRepository notificationRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.deliveryRepository = deliveryRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public OrderDto createOrder(Long customerId, OrderRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        String customerName = (request.getCustomerName() != null && !request.getCustomerName().isBlank())
                ? request.getCustomerName()
                : customer.getName();

        List<OrderItem> itemsToCreate = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        String farmerPickupLocation = "AgriHub Farms, Nashik";

        // Check if items were provided directly or using Cart
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

                if (product.getStock() != null && product.getStock() < itemReq.getQuantity()) {
                    throw new BadRequestException("Not enough stock for product: " + product.getName());
                }

                // Deduct stock
                product.setStock(product.getStock() - itemReq.getQuantity());
                productRepository.save(product);

                BigDecimal itemTotal = BigDecimal.valueOf(product.getPrice() * itemReq.getQuantity());
                totalAmount = totalAmount.add(itemTotal);

                Long farmerId = product.getFarmer() != null ? product.getFarmer().getId() : 1L;
                if (product.getFarmer() != null && product.getFarmer().getLocation() != null) {
                    farmerPickupLocation = product.getFarmer().getLocation() + ", " + product.getFarmer().getState();
                }

                OrderItem orderItem = new OrderItem(null, product, product.getName(), itemReq.getQuantity(), product.getPrice(), farmerId);
                itemsToCreate.add(orderItem);
            }
        } else {
            // Use cart
            Cart cart = cartRepository.findByCustomerId(customerId)
                    .orElseThrow(() -> new BadRequestException("Cart is empty. Please add items to checkout"));

            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new BadRequestException("Cart is empty. Please add items to checkout");
            }

            for (CartItem cartItem : cart.getItems()) {
                Product product = cartItem.getProduct();
                if (product.getStock() != null && product.getStock() < cartItem.getQuantity()) {
                    throw new BadRequestException("Not enough stock for " + product.getName());
                }

                product.setStock(product.getStock() - cartItem.getQuantity());
                productRepository.save(product);

                BigDecimal itemTotal = BigDecimal.valueOf(cartItem.getPrice() * cartItem.getQuantity());
                totalAmount = totalAmount.add(itemTotal);

                Long farmerId = product.getFarmer() != null ? product.getFarmer().getId() : 1L;
                if (product.getFarmer() != null && product.getFarmer().getLocation() != null) {
                    farmerPickupLocation = product.getFarmer().getLocation() + ", " + product.getFarmer().getState();
                }

                OrderItem orderItem = new OrderItem(null, product, product.getName(), cartItem.getQuantity(), cartItem.getPrice(), farmerId);
                itemsToCreate.add(orderItem);
            }

            // Clear the cart
            cart.getItems().clear();
            cartItemRepository.deleteByCartId(cart.getId());
            cartRepository.save(cart);
        }

        Order order = new Order(customer, customerName, request.getDeliveryAddress(), totalAmount, OrderStatus.PLACED);
        order = orderRepository.save(order);

        for (OrderItem oi : itemsToCreate) {
            oi.setOrder(order);
            orderItemRepository.save(oi);
        }
        order.setItems(itemsToCreate);

        // Create initial Delivery tracking record
        Delivery delivery = new Delivery(
                order.getId(),
                "Rajesh Kumar (AgriLogistics)",
                "MH-15-AG-4022 (Refrigerated Van)",
                farmerPickupLocation,
                request.getDeliveryAddress(),
                19.9975, // Starting near Nashik Agri Hub
                73.7898,
                "Approx. 24-36 Hours",
                OrderStatus.PLACED.name()
        );
        deliveryRepository.save(delivery);

        // Create notification
        Notification notification = new Notification(
                customer,
                "Order #" + order.getId() + " Placed Successfully!",
                "Your farm-fresh order totaling ₹" + totalAmount + " has been placed and is sent to the local farmers."
        );
        notificationRepository.save(notification);

        return mapToDto(order);
    }

    public OrderDto getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return mapToDto(order);
    }

    public List<OrderDto> getOrdersForCustomer(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<OrderDto> getOrdersForFarmer(Long farmerId) {
        return orderRepository.findOrdersByFarmerId(farmerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        order.setStatus(status);
        order = orderRepository.save(order);

        // Update corresponding Delivery status
        Optional<Delivery> deliveryOpt = deliveryRepository.findByOrderId(orderId);
        if (deliveryOpt.isPresent()) {
            Delivery delivery = deliveryOpt.get();
            delivery.setStatus(status.name());
            delivery.setUpdatedAt(LocalDateTime.now());
            // Update realistic coordinates progression based on status
            if (status == OrderStatus.PICKED_UP || status == OrderStatus.IN_TRANSIT) {
                delivery.setLatitude(19.2183);
                delivery.setLongitude(72.9781); // Thane / outer ring
                delivery.setEta("4-6 Hours");
            } else if (status == OrderStatus.OUT_FOR_DELIVERY) {
                delivery.setLatitude(19.0760);
                delivery.setLongitude(72.8777); // Mumbai delivery destination
                delivery.setEta("Within 45 mins");
            } else if (status == OrderStatus.DELIVERED) {
                delivery.setEta("Delivered");
            }
            deliveryRepository.save(delivery);
        }

        // Notify customer
        Notification notification = new Notification(
                order.getCustomer(),
                "Order #" + order.getId() + " Update: " + status.name().replace("_", " "),
                "Your order status has changed to: " + status.name().replace("_", " ")
        );
        notificationRepository.save(notification);

        return mapToDto(order);
    }

    public OrderDto mapToDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomer() != null ? order.getCustomer().getId() : null);
        dto.setCustomerName(order.getCustomerName());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(item -> {
                OrderItemDto itemDto = new OrderItemDto();
                itemDto.setId(item.getId());
                itemDto.setProductId(item.getProduct() != null ? item.getProduct().getId() : null);
                itemDto.setProductName(item.getProductName());
                itemDto.setProductImageUrl(item.getProduct() != null ? item.getProduct().getImageUrl() : null);
                itemDto.setQuantity(item.getQuantity());
                itemDto.setPrice(item.getPrice());
                itemDto.setSubtotal(item.getPrice() * item.getQuantity());
                itemDto.setFarmerId(item.getFarmerId());
                return itemDto;
            }).collect(Collectors.toList()));
        }

        deliveryRepository.findByOrderId(order.getId()).ifPresent(del -> {
            dto.setDeliveryId(del.getId());
            dto.setDeliveryStatus(del.getStatus());
            dto.setDeliveryEta(del.getEta());
        });

        return dto;
    }
}
