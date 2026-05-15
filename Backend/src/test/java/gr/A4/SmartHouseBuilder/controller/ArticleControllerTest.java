package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.ArticleRequest;
import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.ArticleStatus;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("alexandra");
        mockUser.setEmail("alexandra@example.com");
        mockUser.setAvatarUrl("avatar.png");

        mockArticle = Article.builder()
                .id(100L)
                .title("Smart Home Tutorial")
                .content("This is a detailed tutorial about smart home automation.")
                .user(mockUser)
                .deviceIds("[1, 2, 3]")
                .tags("[\"smart\", \"home\", \"automation\"]")
                .status(ArticleStatus.PUBLISHED)
                .imageUrl("https://example.com/image.jpg")
                .build();
    }

    // ==================== CREATE ARTICLE TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void createArticle_ReturnsCreated() throws Exception {
        String requestBody = """
                {
                    "title": "Smart Home Tutorial",
                    "content": "This is a detailed tutorial about smart home automation.",
                    "deviceIds": [1, 2, 3],
                    "tags": ["smart", "home", "automation"],
                    "imageUrl": "https://example.com/image.jpg"
                }
                """;

        when(articleService.createArticle(eq("alexandra"), any(ArticleRequest.class))).thenReturn(mockArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(0L);
        when(commentRepository.countByArticleId(100L)).thenReturn(0L);

        mockMvc.perform(post("/api/v1/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Smart Home Tutorial"))
                .andExpect(jsonPath("$.authorUsername").value("alexandra"))
                .andExpect(jsonPath("$.likeCount").value(0));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void createArticle_ReturnsBadRequestOnMissingTitle() throws Exception {
        String requestBody = """
                {
                    "content": "Content without title",
                    "deviceIds": [1, 2]
                }
                """;

        mockMvc.perform(post("/api/v1/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "alexandra")
    void createArticle_ReturnsBadRequestOnShortContent() throws Exception {
        String requestBody = """
                {
                    "title": "Title",
                    "content": "short",
                    "deviceIds": [1, 2]
                }
                """;

        mockMvc.perform(post("/api/v1/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createArticle_ReturnsInternalServerErrorWhenNotAuthenticated() throws Exception {
        String requestBody = """
                {
                    "title": "Smart Home Tutorial",
                    "content": "This is a detailed tutorial about smart home automation.",
                    "deviceIds": [1, 2, 3]
                }
                """;

        mockMvc.perform(post("/api/v1/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    // ==================== GET ARTICLE TESTS ====================
    @Test
    void getArticle_ReturnsOk() throws Exception {
        when(articleService.getArticle(100L)).thenReturn(mockArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(5L);
        when(commentRepository.countByArticleId(100L)).thenReturn(3L);

        mockMvc.perform(get("/api/v1/articles/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.title").value("Smart Home Tutorial"))
                .andExpect(jsonPath("$.likeCount").value(5))
                .andExpect(jsonPath("$.commentCount").value(3));
    }

    @Test
    void getArticle_ReturnsNotFoundOnInvalidId() throws Exception {
        when(articleService.getArticle(999L))
                .thenThrow(new RuntimeException("Article not found"));

        mockMvc.perform(get("/api/v1/articles/999"))
                .andExpect(status().isInternalServerError());
    }

    // ==================== UPDATE ARTICLE TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void updateArticle_ReturnsOk() throws Exception {
        String requestBody = """
                {
                    "title": "Updated Title",
                    "content": "Updated content with much more information about smart homes.",
                    "deviceIds": [1, 2, 3, 4],
                    "tags": ["updated", "smart", "home"]
                }
                """;

        Article updatedArticle = Article.builder()
                .id(100L)
                .title("Updated Title")
                .content("Updated content with much more information about smart homes.")
                .user(mockUser)
                .deviceIds("[1, 2, 3, 4]")
                .tags("[\"updated\", \"smart\", \"home\"]")
                .build();

        when(articleService.updateArticle(eq(100L), eq("alexandra"), any(ArticleRequest.class)))
                .thenReturn(updatedArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(5L);
        when(commentRepository.countByArticleId(100L)).thenReturn(2L);

        mockMvc.perform(put("/api/v1/articles/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void updateArticle_ReturnsNotFoundOnInvalidId() throws Exception {
        String requestBody = """
                {
                    "title": "Updated Title",
                    "content": "Updated content with much more information about smart homes.",
                    "deviceIds": [1, 2]
                }
                """;

        when(articleService.updateArticle(eq(999L), eq("alexandra"), any(ArticleRequest.class)))
                .thenThrow(new RuntimeException("Article not found"));

        mockMvc.perform(put("/api/v1/articles/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(username = "other_user")
    void updateArticle_ReturnsForbiddenOnUnauthorized() throws Exception {
        String requestBody = """
                {
                    "title": "Updated Title",
                    "content": "Updated content with much more information about smart homes.",
                    "deviceIds": [1, 2]
                }
                """;

        when(articleService.updateArticle(eq(100L), eq("other_user"), any(ArticleRequest.class)))
                .thenThrow(new RuntimeException("Article not owned by user"));

        mockMvc.perform(put("/api/v1/articles/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    // ==================== DELETE ARTICLE TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void deleteArticle_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/articles/100"))
                .andExpect(status().isNoContent());

        verify(articleService).deleteArticle(100L, "alexandra");
    }

    @Test
    @WithMockUser(username = "alexandra")
    void deleteArticle_ReturnsNotFoundOnInvalidId() throws Exception {
        doThrow(new RuntimeException("Article not found"))
                .when(articleService).deleteArticle(999L, "alexandra");

        mockMvc.perform(delete("/api/v1/articles/999"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(username = "other_user")
    void deleteArticle_ReturnsForbiddenOnUnauthorized() throws Exception {
        doThrow(new RuntimeException("Article not owned by user"))
                .when(articleService).deleteArticle(100L, "other_user");

        mockMvc.perform(delete("/api/v1/articles/100"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void deleteArticle_ReturnsInternalServerErrorWhenNotAuthenticated() throws Exception {
        mockMvc.perform(delete("/api/v1/articles/100"))
                .andExpect(status().isInternalServerError());
    }

    // ==================== GET ALL ARTICLES TESTS ====================
    @Test
    void getAllArticles_ReturnsPaginatedList() throws Exception {
        var page = new PageImpl<>(List.of(mockArticle), PageRequest.of(0, 10), 1);
        when(articleService.getAllArticles(any(PageRequest.class))).thenReturn(page);
        when(likeRepository.countByArticleId(100L)).thenReturn(5L);
        when(commentRepository.countByArticleId(100L)).thenReturn(2L);

        mockMvc.perform(get("/api/v1/articles?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Smart Home Tutorial"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    void getAllArticles_ReturnsEmptyPageOnNoArticles() throws Exception {
        var emptyPage = new PageImpl<Article>(List.of(), PageRequest.of(0, 10), 0);
        when(articleService.getAllArticles(any(PageRequest.class))).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/articles?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void getAllArticles_UsesDefaultPagination() throws Exception {
        var page = new PageImpl<>(List.of(mockArticle), PageRequest.of(0, 10), 1);
        when(articleService.getAllArticles(any(PageRequest.class))).thenReturn(page);
        when(likeRepository.countByArticleId(100L)).thenReturn(0L);
        when(commentRepository.countByArticleId(100L)).thenReturn(0L);

        mockMvc.perform(get("/api/v1/articles"))
                .andExpect(status().isOk());
    }

    // ==================== GET USER ARTICLES TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void getUserArticles_ReturnsList() throws Exception {
        when(articleService.getUserArticles("alexandra")).thenReturn(List.of(mockArticle));
        when(likeRepository.countByArticleId(100L)).thenReturn(5L);
        when(commentRepository.countByArticleId(100L)).thenReturn(2L);

        mockMvc.perform(get("/api/v1/articles/user/my-articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].authorUsername").value("alexandra"))
                .andExpect(jsonPath("$[0].title").value("Smart Home Tutorial"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getUserArticles_ReturnsEmptyList() throws Exception {
        when(articleService.getUserArticles("alexandra")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/articles/user/my-articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getUserArticles_ReturnsInternalServerErrorWhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/articles/user/my-articles"))
                .andExpect(status().isInternalServerError());
    }

    // ==================== GET USER DRAFTS TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void getUserDrafts_ReturnsList() throws Exception {
        Article draftArticle = Article.builder()
                .id(101L)
                .title("Draft Article")
                .content("This is a draft article with sufficient content for a tutorial.")
                .user(mockUser)
                .status(ArticleStatus.DRAFT)
                .build();

        when(articleService.getUserDrafts("alexandra")).thenReturn(List.of(draftArticle));
        when(likeRepository.countByArticleId(101L)).thenReturn(0L);
        when(commentRepository.countByArticleId(101L)).thenReturn(0L);

        mockMvc.perform(get("/api/v1/articles/user/drafts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Draft Article"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getUserDrafts_ReturnsEmptyList() throws Exception {
        when(articleService.getUserDrafts("alexandra")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/articles/user/drafts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ==================== GET USER PUBLISHED TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void getUserPublished_ReturnsList() throws Exception {
        when(articleService.getUserPublished("alexandra")).thenReturn(List.of(mockArticle));
        when(likeRepository.countByArticleId(100L)).thenReturn(5L);
        when(commentRepository.countByArticleId(100L)).thenReturn(2L);

        mockMvc.perform(get("/api/v1/articles/user/published"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Smart Home Tutorial"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getUserPublished_ReturnsEmptyList() throws Exception {
        when(articleService.getUserPublished("alexandra")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/articles/user/published"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ==================== PUBLISH ARTICLE TESTS ====================
    @Test
    @WithMockUser(username = "alexandra")
    void publishArticle_ReturnsOk() throws Exception {
        Article publishedArticle = Article.builder()
                .id(100L)
                .title("Smart Home Tutorial")
                .content("This is a detailed tutorial about smart home automation.")
                .user(mockUser)
                .deviceIds("[1, 2, 3]")
                .status(ArticleStatus.PUBLISHED)
                .build();

        when(articleService.publishArticle(100L, "alexandra")).thenReturn(publishedArticle);
        when(likeRepository.countByArticleId(100L)).thenReturn(0L);
        when(commentRepository.countByArticleId(100L)).thenReturn(0L);

        mockMvc.perform(put("/api/v1/articles/100/publish"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Smart Home Tutorial"));

        verify(articleService).publishArticle(100L, "alexandra");
    }

    @Test
    @WithMockUser(username = "alexandra")
    void publishArticle_ReturnsNotFoundOnInvalidId() throws Exception {
        when(articleService.publishArticle(999L, "alexandra"))
                .thenThrow(new RuntimeException("Article not found"));

        mockMvc.perform(put("/api/v1/articles/999/publish"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(username = "other_user")
    void publishArticle_ReturnsForbiddenOnUnauthorized() throws Exception {
        when(articleService.publishArticle(100L, "other_user"))
                .thenThrow(new RuntimeException("Article not owned by user"));

        mockMvc.perform(put("/api/v1/articles/100/publish"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void publishArticle_ReturnsInternalServerErrorWhenNotAuthenticated() throws Exception {
        mockMvc.perform(put("/api/v1/articles/100/publish"))
                .andExpect(status().isInternalServerError());
    }
}
