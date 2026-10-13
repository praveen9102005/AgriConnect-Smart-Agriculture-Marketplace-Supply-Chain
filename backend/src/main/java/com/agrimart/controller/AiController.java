package com.agrimart.controller;

import com.agrimart.dto.AiRecommendationDto;
import com.agrimart.service.AiRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiRecommendationService aiRecommendationService;

    public AiController(AiRecommendationService aiRecommendationService) {
        this.aiRecommendationService = aiRecommendationService;
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<AiRecommendationDto>> getRecommendations(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "6") int limit) {
        List<AiRecommendationDto> recommendations = aiRecommendationService.getRecommendations(customerId, productId, category, limit);
        return ResponseEntity.ok(recommendations);
    }
}
