package com.agrimart.controller;

import com.agrimart.dto.CreateReviewRequest;
import com.agrimart.dto.ReviewDto;
import com.agrimart.entity.User;
import com.agrimart.exception.BadRequestException;
import com.agrimart.repository.UserRepository;
import com.agrimart.security.SecurityUtils;
import com.agrimart.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    public ReviewController(ReviewService reviewService, UserRepository userRepository) {
        this.reviewService = reviewService;
        this.userRepository = userRepository;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDto>> getReviewsForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsForProduct(productId));
    }

    @PostMapping
    public ResponseEntity<ReviewDto> addReview(@Valid @RequestBody CreateReviewRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            throw new BadRequestException("User is not authenticated");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        ReviewDto created = reviewService.addReview(user.getId(), request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
}
