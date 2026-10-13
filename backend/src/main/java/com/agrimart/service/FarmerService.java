package com.agrimart.service;

import com.agrimart.dto.FarmerDto;
import com.agrimart.entity.Farmer;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.FarmerRepository;
import com.agrimart.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FarmerService {

    private final FarmerRepository farmerRepository;
    private final ProductRepository productRepository;

    public FarmerService(FarmerRepository farmerRepository, ProductRepository productRepository) {
        this.farmerRepository = farmerRepository;
        this.productRepository = productRepository;
    }

    public List<FarmerDto> getAllFarmers() {
        return farmerRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<FarmerDto> getTopFarmers() {
        return farmerRepository.findTop8ByOrderByRatingDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public FarmerDto getFarmerById(Long id) {
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));
        return mapToDto(farmer);
    }

    public FarmerDto getFarmerByUserId(Long userId) {
        Farmer farmer = farmerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer profile not found for user id: " + userId));
        return mapToDto(farmer);
    }

    @Transactional
    public FarmerDto updateFarmer(Long id, FarmerDto dto) {
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + id));

        if (dto.getName() != null) farmer.setName(dto.getName());
        if (dto.getState() != null) farmer.setState(dto.getState());
        if (dto.getLocation() != null) farmer.setLocation(dto.getLocation());
        if (dto.getSpecialty() != null) farmer.setSpecialty(dto.getSpecialty());
        if (dto.getPhone() != null) farmer.setPhone(dto.getPhone());
        if (dto.getEmail() != null) farmer.setEmail(dto.getEmail());

        farmer = farmerRepository.save(farmer);
        return mapToDto(farmer);
    }

    public FarmerDto mapToDto(Farmer farmer) {
        FarmerDto dto = new FarmerDto();
        dto.setId(farmer.getId());
        dto.setName(farmer.getName());
        dto.setState(farmer.getState());
        dto.setLocation(farmer.getLocation());
        dto.setSpecialty(farmer.getSpecialty());
        dto.setPhone(farmer.getPhone());
        dto.setEmail(farmer.getEmail());
        dto.setRating(farmer.getRating());
        dto.setVerified(farmer.getVerified());
        dto.setUserId(farmer.getUser() != null ? farmer.getUser().getId() : null);

        int count = productRepository.findByFarmerId(farmer.getId()).size();
        dto.setProductsCount(count);
        return dto;
    }
}
