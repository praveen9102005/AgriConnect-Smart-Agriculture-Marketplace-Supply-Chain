package com.agrimart.controller;

import com.agrimart.dto.FarmerDto;
import com.agrimart.service.FarmerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {

    private final FarmerService farmerService;

    public FarmerController(FarmerService farmerService) {
        this.farmerService = farmerService;
    }

    @GetMapping
    public ResponseEntity<List<FarmerDto>> getAllFarmers() {
        return ResponseEntity.ok(farmerService.getAllFarmers());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<FarmerDto>> getFeaturedFarmers() {
        return ResponseEntity.ok(farmerService.getTopFarmers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FarmerDto> getFarmerById(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<FarmerDto> getFarmerByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(farmerService.getFarmerByUserId(userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<FarmerDto> updateFarmer(@PathVariable Long id, @RequestBody FarmerDto dto) {
        return ResponseEntity.ok(farmerService.updateFarmer(id, dto));
    }
}
