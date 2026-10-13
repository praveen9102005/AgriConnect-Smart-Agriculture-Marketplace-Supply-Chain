package com.agrimart.service;

import com.agrimart.dto.CategoryDto;
import com.agrimart.entity.Category;
import com.agrimart.exception.ResourceNotFoundException;
import com.agrimart.repository.CategoryRepository;
import com.agrimart.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapToDto(category);
    }

    public CategoryDto mapToDto(Category category) {
        long count = productRepository.countByCategoryIgnoreCase(category.getName());
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getIcon(),
                category.getImageUrl(),
                count
        );
    }
}
