package com.agrimart.service;

import com.agrimart.dto.DeliveryDto;
import com.agrimart.dto.DeliveryStatusUpdateRequest;
import com.agrimart.entity.Delivery;
import com.agrimart.entity.Order;
import com.agrimart.entity.OrderStatus;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.DeliveryRepository;
import com.agrimart.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;

    public DeliveryService(DeliveryRepository deliveryRepository, OrderRepository orderRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
    }

    public List<DeliveryDto> getAllDeliveries() {
        return deliveryRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DeliveryDto> getDeliveriesByStatus(String status) {
        return deliveryRepository.findByStatus(status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DeliveryDto getDeliveryById(Long id) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + id));
        return mapToDto(delivery);
    }

    public DeliveryDto getDeliveryByOrderId(Long orderId) {
        return deliveryRepository.findByOrderId(orderId)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional
    public DeliveryDto updateDeliveryStatus(Long id, DeliveryStatusUpdateRequest request) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + id));

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            delivery.setStatus(request.getStatus());

            // Sync with Order Status if applicable
            try {
                OrderStatus matchedStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
                if (delivery.getOrderId() != null) {
                    orderRepository.findById(delivery.getOrderId()).ifPresent(order -> {
                        order.setStatus(matchedStatus);
                        orderRepository.save(order);
                    });
                }
            } catch (IllegalArgumentException ignored) {
            }
        }

        if (request.getLatitude() != null) delivery.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) delivery.setLongitude(request.getLongitude());
        if (request.getEta() != null) delivery.setEta(request.getEta());
        delivery.setUpdatedAt(LocalDateTime.now());

        delivery = deliveryRepository.save(delivery);
        return mapToDto(delivery);
    }

    public DeliveryDto mapToDto(Delivery delivery) {
        DeliveryDto dto = new DeliveryDto();
        dto.setId(delivery.getId());
        dto.setOrderId(delivery.getOrderId());
        dto.setDriverName(delivery.getDriverName());
        dto.setVehicleNumber(delivery.getVehicleNumber());
        dto.setPickup(delivery.getPickup());
        dto.setDestination(delivery.getDestination());
        dto.setLatitude(delivery.getLatitude());
        dto.setLongitude(delivery.getLongitude());
        dto.setEta(delivery.getEta());
        dto.setStatus(delivery.getStatus());
        dto.setUpdatedAt(delivery.getUpdatedAt());

        if (delivery.getOrderId() != null) {
            orderRepository.findById(delivery.getOrderId()).ifPresent(order -> {
                dto.setCustomerName(order.getCustomerName());
                if (order.getTotalAmount() != null) {
                    dto.setTotalAmount(order.getTotalAmount().doubleValue());
                }
            });
        }

        return dto;
    }
}
