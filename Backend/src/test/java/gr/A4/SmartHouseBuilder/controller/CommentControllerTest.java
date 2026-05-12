package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.CommentRequest;
import gr.A4.SmartHouseBuilder.dto.CommentResponse;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CommentService commentService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    private CommentResponse mockCommentResponse;

    @BeforeEach
    void setUp() {
        mockCommentResponse = CommentResponse.builder()
                .id(1L)
                .userId(100L)
                .username("alexandra")
                .avatarUrl("avatar.png")
                .content("Acesta este un comentariu de test valid")
                .createdAt(LocalDateTime.now())
                .isOwner(true)
                .build();
    }

    @Test
    @WithMockUser(username = "alexandra")
    void createSetupComment_ReturnsCreated() throws Exception {
        String requestBody = """
                {
                    "content": "Acesta este un comentariu de test valid"
                }
                """;

        when(commentService.createSetupComment(eq(1L), eq("alexandra"), any(CommentRequest.class)))
                .thenReturn(mockCommentResponse);

        mockMvc.perform(post("/api/v1/setups/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Acesta este un comentariu de test valid"))
                .andExpect(jsonPath("$.username").value("alexandra"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getSetupComments_ReturnsOk() throws Exception {
        var page = new PageImpl<>(List.of(mockCommentResponse));
        when(commentService.getSetupComments(eq(1L), any(Pageable.class), eq("alexandra"))).thenReturn(page);

        mockMvc.perform(get("/api/v1/setups/1/comments?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("alexandra"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void createArticleComment_ReturnsCreated() throws Exception {
        String requestBody = """
                {
                    "content": "Acesta este un comentariu de test valid"
                }
                """;

        when(commentService.createArticleComment(eq(1L), eq("alexandra"), any(CommentRequest.class)))
                .thenReturn(mockCommentResponse);

        mockMvc.perform(post("/api/v1/articles/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Acesta este un comentariu de test valid"));
    }

    @Test
    void getArticleComments_Unauthenticated_ReturnsOk() throws Exception {
        var page = new PageImpl<>(List.of(mockCommentResponse));
        when(commentService.getArticleComments(eq(1L), any(Pageable.class), eq(null))).thenReturn(page);

        mockMvc.perform(get("/api/v1/articles/1/comments?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("alexandra"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void deleteComment_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/comments/1"))
                .andExpect(status().isNoContent());

        verify(commentService).deleteComment(1L, "alexandra");
    }

    @Test
    void getSetupCommentCount_ReturnsOk() throws Exception {
        when(commentService.getSetupCommentCount(1L)).thenReturn(42L);

        mockMvc.perform(get("/api/v1/setups/1/comment-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commentCount").value(42));
    }

    @Test
    void getArticleCommentCount_ReturnsOk() throws Exception {
        when(commentService.getArticleCommentCount(1L)).thenReturn(15L);

        mockMvc.perform(get("/api/v1/articles/1/comment-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commentCount").value(15));
    }
}