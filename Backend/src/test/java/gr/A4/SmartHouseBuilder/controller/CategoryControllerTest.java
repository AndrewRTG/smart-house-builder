package gr.A4.SmartHouseBuilder.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.CategoryRequest;
import gr.A4.SmartHouseBuilder.dto.CategoryResponse;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.OAuth2LoginSuccessHandler;
import gr.A4.SmartHouseBuilder.security.RateLimitingFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
public class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private RateLimitingFilter rateLimitingFilter;

    @MockitoBean
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/categories - Caz fericit: Returnează o listă de categorii cu status 200")
    void getAllCategories_ShouldReturn200AndList() throws Exception {
        List<CategoryResponse> mockCategories = List.of(
                new CategoryResponse(1, "Iluminat", "Becuri și benzi LED"),
                new CategoryResponse(2, "Securitate", "Camere și senzori")
        );

        when(categoryService.getAllCategories()).thenReturn(mockCategories);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].name").value("Iluminat"))
                .andExpect(jsonPath("$[1].name").value("Securitate"));
    }

    @Test
    @DisplayName("POST /api/categories - Caz fericit: Returnează 201 la cerere validă")
    void createCategory_ValidRequest_ShouldReturn201() throws Exception {
        CategoryRequest request = new CategoryRequest("Smart Hubs", "Hub-uri de control central");
        CategoryResponse response = new CategoryResponse(3, "Smart Hubs", "Hub-uri de control central");

        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Smart Hubs"));
    }

    @Test
    @DisplayName("POST /api/categories - Caz de eroare: Returnează 400 la date invalide (lipsă nume)")
    void createCategory_InvalidRequest_ShouldReturn400() throws Exception {
        CategoryRequest invalidRequest = new CategoryRequest("", "Descriere valida");

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}