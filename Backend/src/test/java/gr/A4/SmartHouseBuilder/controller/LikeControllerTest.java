package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.LikeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = LikeController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class LikeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LikeService likeService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @WithMockUser(username = "alexandra")
    void toggleSetupLike_ReturnsOk() throws Exception {
        when(likeService.toggleSetupLike(1L, "alexandra")).thenReturn(true);
        when(likeService.getSetupLikeCount(1L)).thenReturn(42L);

        mockMvc.perform(post("/api/v1/setups/1/like"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLiked").value(true))
                .andExpect(jsonPath("$.likeCount").value(42));
    }

    @Test
    void getSetupLikeCount_ReturnsOk() throws Exception {
        when(likeService.getSetupLikeCount(1L)).thenReturn(100L);

        mockMvc.perform(get("/api/v1/setups/1/like-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(100));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void toggleArticleLike_ReturnsOk() throws Exception {

        when(likeService.toggleArticleLike(1L, "alexandra")).thenReturn(false);
        when(likeService.getArticleLikeCount(1L)).thenReturn(15L);

        mockMvc.perform(post("/api/v1/articles/1/like"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLiked").value(false))
                .andExpect(jsonPath("$.likeCount").value(15));
    }

    @Test
    void getArticleLikeCount_ReturnsOk() throws Exception {
        when(likeService.getArticleLikeCount(1L)).thenReturn(250L);

        mockMvc.perform(get("/api/v1/articles/1/like-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(250));
    }
}