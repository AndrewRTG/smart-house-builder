package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.CategoryRequest;
import gr.A4.SmartHouseBuilder.entity.Category;
import gr.A4.SmartHouseBuilder.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void createCategory_mapsRequestAndReturnsResponse() {
        Category saved = new Category();
        saved.setId(7);
        saved.setName("Sensors");
        saved.setDescription("All kinds of sensors");
        when(categoryRepository.save(any(Category.class))).thenReturn(saved);

        var response = categoryService.createCategory(new CategoryRequest("Sensors", "All kinds of sensors"));

        assertThat(response.id()).isEqualTo(7);
        assertThat(response.name()).isEqualTo("Sensors");
        assertThat(response.description()).isEqualTo("All kinds of sensors");
    }

    @Test
    void getAllCategories_mapsRepositoryEntitiesToResponses() {
        Category first = new Category();
        first.setId(1);
        first.setName("Lighting");
        first.setDescription("Smart lights");

        Category second = new Category();
        second.setId(2);
        second.setName("Security");
        second.setDescription("Sensors and alarms");

        when(categoryRepository.findAll()).thenReturn(List.of(first, second));

        var responses = categoryService.getAllCategories();

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting("name").containsExactly("Lighting", "Security");
    }
}
