package com.agrimart.service;

import com.agrimart.dto.CreateReviewRequest;
import com.agrimart.dto.ReviewDto;
import com.agrimart.entity.Product;
import com.agrimart.entity.Review;
import com.agrimart.entity.User;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.ProductRepository;
import com.agrimart.repository.ReviewRepository;
import com.agrimart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public List<ReviewDto> getReviewsForProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewDto addReview(Long customerId, CreateReviewRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        Review review = new Review(product, customer, customer.getName(), request.getRating(), request.getComment());
        review = reviewRepository.save(review);

        // Recalculate average rating
        List<Review> allReviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(product.getId());
        double avg = allReviews.stream().mapToDouble(Review::getRating).average().orElse(request.getRating());
        avg = Math.round(avg * 10.0) / 10.0;
        product.setRating(avg);
        product.setReviews(allReviews.size());
        productRepository.save(product);

        return mapToDto(review);
    }

    public ReviewDto mapToDto(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setId(review.getId());
        dto.setProductId(review.getProduct().getId());
        dto.setCustomerId(review.getCustomer().getId());
        dto.setCustomerName(review.getCustomerName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}
