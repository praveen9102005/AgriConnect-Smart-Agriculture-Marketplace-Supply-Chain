package com.agrimart.service;

import com.agrimart.dto.AddToCartRequest;
import com.agrimart.dto.CartDto;
import com.agrimart.dto.CartItemDto;
import com.agrimart.entity.Cart;
import com.agrimart.entity.CartItem;
import com.agrimart.entity.Product;
import com.agrimart.entity.User;
import com.agrimart.exception.BadRequestException;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.CartItemRepository;
import com.agrimart.repository.CartRepository;
import com.agrimart.repository.ProductRepository;
import com.agrimart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public Cart getOrCreateCart(Long customerId) {
        return cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    User customer = userRepository.findById(customerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
                    Cart newCart = new Cart(customer);
                    return cartRepository.save(newCart);
                });
    }

    @Transactional
    public CartDto getCartDto(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto addToCart(Long customerId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(customerId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (product.getStock() != null && product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Requested quantity exceeds available stock of " + product.getStock());
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            item.setPrice(product.getPrice());
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, product, request.getQuantity(), product.getPrice());
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cart = cartRepository.save(cart);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto updateQuantity(Long customerId, Long itemId, int quantity) {
        Cart cart = getOrCreateCart(customerId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to your cart");
        }

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            if (item.getProduct().getStock() != null && item.getProduct().getStock() < quantity) {
                throw new BadRequestException("Available stock is only " + item.getProduct().getStock());
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cart = cartRepository.save(cart);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto removeItem(Long customerId, Long itemId) {
        Cart cart = getOrCreateCart(customerId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to your cart");
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        cart.setUpdatedAt(LocalDateTime.now());
        cart = cartRepository.save(cart);
        return mapToDto(cart);
    }

    @Transactional
    public void clearCart(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        cart.getItems().clear();
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    public CartDto mapToDto(Cart cart) {
        CartDto dto = new CartDto();
        dto.setId(cart.getId());
        dto.setCustomerId(cart.getCustomer().getId());

        double totalAmount = 0.0;
        int totalCount = 0;

        if (cart.getItems() != null) {
            dto.setItems(cart.getItems().stream().map(item -> {
                CartItemDto itemDto = new CartItemDto();
                itemDto.setId(item.getId());
                itemDto.setProductId(item.getProduct().getId());
                itemDto.setProductName(item.getProduct().getName());
                itemDto.setProductImageUrl(item.getProduct().getImageUrl());
                itemDto.setUnit(item.getProduct().getUnit());
                itemDto.setPrice(item.getPrice());
                itemDto.setQuantity(item.getQuantity());
                itemDto.setSubtotal(item.getPrice() * item.getQuantity());
                itemDto.setFarmerId(item.getProduct().getFarmer() != null ? item.getProduct().getFarmer().getId() : null);
                return itemDto;
            }).collect(Collectors.toList()));

            for (CartItem item : cart.getItems()) {
                totalAmount += (item.getPrice() * item.getQuantity());
                totalCount += item.getQuantity();
            }
        }

        dto.setTotalAmount(Math.round(totalAmount * 100.0) / 100.0);
        dto.setTotalCount(totalCount);
        return dto;
    }
}
