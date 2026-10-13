package com.agrimart.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class OrderRequest {
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String customerName;

    // Optional: if ordering directly without using the cart
    private List<OrderItemRequest> items;

    public OrderRequest() {
    }

    public OrderRequest(String deliveryAddress, String customerName) {
        this.deliveryAddress = deliveryAddress;
        this.customerName = customerName;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;

        public OrderItemRequest() {
        }

        public OrderItemRequest(Long productId, Integer quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
