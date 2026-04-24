package gr.A4.SmartHouseBuilder.endpoint.service;


import gr.A4.SmartHouseBuilder.endpoint.dto.CategoryRequest;
import gr.A4.SmartHouseBuilder.endpoint.dto.CategoryResponse;
import gr.A4.SmartHouseBuilder.endpoint.entity.Category;
import gr.A4.SmartHouseBuilder.endpoint.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryResponse createCategory (CategoryRequest request){
        Category category = new Category();
        category.setName(request.name());
        category.setDescription(request.description());

        category = categoryRepository.save(category);
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
    }
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream().
                map(category -> new CategoryResponse(category.getId(), category.getName(), category.getDescription()))
                .toList();
    }
}
