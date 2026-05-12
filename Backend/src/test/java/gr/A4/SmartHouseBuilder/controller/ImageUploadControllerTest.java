package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.S3Service;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.OAuth2LoginSuccessHandler;
import gr.A4.SmartHouseBuilder.security.RateLimitingFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ImageUploadController.class)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "aws.s3.access-key=dummy",
        "aws.s3.secret-key=dummy",
        "aws.s3.region=eu-north-1",
        "aws.s3.bucket=test-bucket",
        "spring.ai.openai.api-key=dummy",
        "spring.security.oauth2.client.registration.google.client-id=dummy",
        "spring.security.oauth2.client.registration.google.client-secret=dummy",
})
class ImageUploadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private S3Service s3Service;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private RateLimitingFilter rateLimitingFilter;

    @MockBean
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Test
    @WithMockUser(username = "test@example.com")
    void uploadAvatar_validImage_returns200WithUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.jpg", "image/jpeg", new byte[100]
        );
        String expectedUrl = "https://test-bucket.s3.eu-north-1.amazonaws.com/avatars/uuid.jpg";
        when(s3Service.upload(any(), eq("avatars"))).thenReturn(expectedUrl);

        mockMvc.perform(multipart("/api/v1/images/avatars")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(expectedUrl));
    }

    @Test
    void uploadAvatar_unauthenticated_returns401() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.jpg", "image/jpeg", new byte[100]
        );

        mockMvc.perform(multipart("/api/v1/images/avatars")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void uploadArticleImage_validImage_returns200WithUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.png", "image/png", new byte[200]
        );
        String expectedUrl = "https://test-bucket.s3.eu-north-1.amazonaws.com/articles/uuid.png";
        when(s3Service.upload(any(), eq("articles"))).thenReturn(expectedUrl);

        mockMvc.perform(multipart("/api/v1/images/articles")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(expectedUrl));
    }

    @Test
    void uploadArticleImage_unauthenticated_returns401() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.png", "image/png", new byte[200]
        );

        mockMvc.perform(multipart("/api/v1/images/articles")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}
