package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.CommentRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.ArticleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ArticleController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ArticleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ArticleService articleService;

    @MockitoBean
    private LikeRepository likeRepository;

    @MockitoBean
    private CommentRepository commentRepository;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    private Article mockArticle;

    @BeforeEach
    void setUp() {
        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("alexandra");
        mockUser.setAvatarUrl("avatar.png");

        mockArticle = Article.builder()
                .id(100L)
                .title("Smart Home Tutorial")
                .content("Acesta este un tutorial lung de minim zece caractere.")
                .user(mockUser)
                .deviceIds("[1, 2]")
                .tags("[\"smart\", \"home\"]")
                .build();
    }

    @Test
    @WithMockUser(username = "alexandra")
    void createArticle_ReturnsCreated() throws Exception {
        String requestBody = """
                {
                    "title": "Smart Home Tutorial",
                    "content": "Acesta este un tutorial lung de minim zece caractere.",
                    "deviceIds": [1, 2],
                    "tags": ["smart", "home"]
                }
                """;

        when(articleService.createArticle(eq("alexandra"), any())).thenReturn(mockArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(5L);
        when(commentRepository.countByArticleId(100L)).thenReturn(2L);

        mockMvc.perform(post("/api/v1/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Smart Home Tutorial"))
                .andExpect(jsonPath("$.likeCount").value(5))
                .andExpect(jsonPath("$.authorUsername").value("alexandra"));
    }

    @Test
    void getArticle_ReturnsOk() throws Exception {
        when(articleService.getArticle(100L)).thenReturn(mockArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(0L);
        when(commentRepository.countByArticleId(100L)).thenReturn(0L);

        mockMvc.perform(get("/api/v1/articles/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Smart Home Tutorial"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void updateArticle_ReturnsOk() throws Exception {
        String requestBody = """
                {
                    "title": "Smart Home Tutorial Modificat",
                    "content": "Continut nou si actualizat pentru acest articol",
                    "deviceIds": [1, 2, 3],
                    "tags": ["smart", "home", "update"]
                }
                """;

        when(articleService.updateArticle(eq(100L), eq("alexandra"), any())).thenReturn(mockArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(12L);
        when(commentRepository.countByArticleId(100L)).thenReturn(4L);

        mockMvc.perform(put("/api/v1/articles/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "alexandra")
    void deleteArticle_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/articles/100"))
                .andExpect(status().isNoContent());

        verify(articleService).deleteArticle(100L, "alexandra");
    }

    @Test
    void getAllArticles_ReturnsPaginatedList() throws Exception {
        var page = new PageImpl<>(List.of(mockArticle));
        when(articleService.getAllArticles(any(PageRequest.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/articles?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Smart Home Tutorial"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getUserArticles_ReturnsList() throws Exception {
        when(articleService.getUserArticles("alexandra")).thenReturn(List.of(mockArticle));

        mockMvc.perform(get("/api/v1/articles/user/my-articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].authorUsername").value("alexandra"));
    }
}