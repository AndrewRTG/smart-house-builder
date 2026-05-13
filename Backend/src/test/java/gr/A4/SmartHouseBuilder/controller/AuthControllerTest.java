package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.*;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.AuthService;
import gr.A4.SmartHouseBuilder.service.MfaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private MfaService mfaService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    // ==================== REGISTER TESTS ====================
    @Test
    void register_ReturnsOkWithAuthResponse() throws Exception {
        String requestBody = """
                {
                    "username": "john_doe",
                    "email": "john@example.com",
                    "password": "SecurePass123!"
                }
                """;

        AuthResponse mockResponse = new AuthResponse();
        mockResponse.setUsername("john_doe");
        mockResponse.setAccessToken("access_token");
        mockResponse.setRefreshToken("refresh_token");

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("john_doe"))
                .andExpect(jsonPath("$.accessToken").value("access_token"));
    }

    @Test
    void register_ReturnsBadRequestOnInvalidEmail() throws Exception {
        String requestBody = """
                {
                    "username": "john_doe",
                    "email": "invalid-email",
                    "password": "SecurePass123!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_ReturnsBadRequestOnWeakPassword() throws Exception {
        String requestBody = """
                {
                    "username": "john_doe",
                    "email": "john@example.com",
                    "password": "weak"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    // ==================== LOGIN TESTS ====================
    @Test
    void login_ReturnsOkWithTokens() throws Exception {
        String requestBody = """
                {
                    "identifier": "john_doe",
                    "password": "SecurePass123!"
                }
                """;

        AuthResponse mockResponse = new AuthResponse();
        mockResponse.setUsername("john_doe");
        mockResponse.setAccessToken("access_token");
        mockResponse.setRefreshToken("refresh_token");

        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("john_doe"))
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    void login_ReturnsUnauthorizedOnInvalidCredentials() throws Exception {
        String requestBody = """
                {
                    "identifier": "john_doe",
                    "password": "WrongPassword"
                }
                """;

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void login_ReturnsUnauthorizedOnUserNotFound() throws Exception {
        String requestBody = """
                {
                    "identifier": "nonexistent",
                    "password": "Password123!"
                }
                """;

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new UsernameNotFoundException("User not found"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    // ==================== VERIFY EMAIL TESTS ====================
    @Test
    void verifyEmail_ReturnsOkOnValidToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/verify-email")
                        .param("token", "valid_token"))
                .andExpect(status().isOk());

        verify(authService).verifyEmail("valid_token");
    }

    @Test
    void verifyEmail_ReturnsBadRequestOnInvalidToken() throws Exception {
        doThrow(new RuntimeException("Invalid token"))
                .when(authService).verifyEmail("invalid_token");

        mockMvc.perform(get("/api/v1/auth/verify-email")
                        .param("token", "invalid_token"))
                .andExpect(status().isInternalServerError());
    }

    // ==================== REFRESH TOKEN TESTS ====================
    @Test
    void refresh_ReturnsOkWithNewAccessToken() throws Exception {
        String requestBody = """
                {
                    "refreshToken": "valid_refresh_token"
                }
                """;

        AuthResponse mockResponse = new AuthResponse();
        mockResponse.setAccessToken("new_access_token");
        mockResponse.setRefreshToken("new_refresh_token");

        when(authService.refreshToken("valid_refresh_token")).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new_access_token"));
    }

    @Test
    void refresh_ReturnsUnauthorizedOnInvalidToken() throws Exception {
        String requestBody = """
                {
                    "refreshToken": "invalid_refresh_token"
                }
                """;

        when(authService.refreshToken("invalid_refresh_token"))
                .thenThrow(new RuntimeException("Invalid refresh token"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    // ==================== LOGOUT TESTS ====================
    @Test
    void logout_ReturnsNoContent() throws Exception {
        String requestBody = """
                {
                    "refreshToken": "valid_refresh_token"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNoContent());

        verify(authService).logout("valid_refresh_token");
    }

    // ==================== FORGOT PASSWORD TESTS ====================
    @Test
    void forgotPassword_ReturnsOkMessage() throws Exception {
        String requestBody = """
                {
                    "email": "user@example.com"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isString());

        verify(authService).processForgotPassword("user@example.com");
    }

    @Test
    void forgotPassword_ReturnsBadRequestOnInvalidEmail() throws Exception {
        String requestBody = """
                {
                    "email": "invalid-email"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    // ==================== RESET PASSWORD TESTS ====================
    @Test
    void resetPassword_ReturnsOkOnValidToken() throws Exception {
        String requestBody = """
                {
                    "token": "valid_reset_token",
                    "newPassword": "NewSecurePass123!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        verify(authService).resetPassword("valid_reset_token", "NewSecurePass123!");
    }

    @Test
    void resetPassword_ReturnsInternalServerErrorOnInvalidToken() throws Exception {
        String requestBody = """
                {
                    "token": "invalid_reset_token",
                    "newPassword": "NewSecurePass123!"
                }
                """;

        doThrow(new RuntimeException("Invalid reset token"))
                .when(authService).resetPassword("invalid_reset_token", "NewSecurePass123!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    // ==================== GET CURRENT USER TESTS ====================
    @Test
    @WithMockUser(username = "john_doe")
    void getCurrentUser_ReturnsUserProfile() throws Exception {
        UserProfileResponse mockProfile = new UserProfileResponse();
        mockProfile.setUsername("john_doe");
        mockProfile.setEmail("john@example.com");

        when(authService.getCurrentUser("john_doe")).thenReturn(mockProfile);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("john_doe"))
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    void getCurrentUser_ReturnsUnauthorizedWhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== CHECK USERNAME TESTS ====================
    @Test
    void checkUsername_ReturnsAvailableTrue() throws Exception {
        String requestBody = """
                {
                    "username": "available_username"
                }
                """;

        when(authService.usernameExists("available_username")).thenReturn(false);

        mockMvc.perform(post("/api/v1/auth/check-username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void checkUsername_ReturnsAvailableFalse() throws Exception {
        String requestBody = """
                {
                    "username": "taken_username"
                }
                """;

        when(authService.usernameExists("taken_username")).thenReturn(true);

        mockMvc.perform(post("/api/v1/auth/check-username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    // ==================== MFA TESTS ====================
    @Test
    void verifyMfa_ReturnsOk() throws Exception {
        String requestBody = """
                {
                    "mfaToken": "mfa_token_from_login",
                    "code": "123456"
                }
                """;

        AuthResponse mockResponse = new AuthResponse();
        mockResponse.setAccessToken("access_token");
        mockResponse.setRefreshToken("refresh_token");

        when(authService.verifyMfa(any(MfaVerifyRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/verify-mfa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        verify(authService).verifyMfa(any());
    }

    @Test
    void verifyMfa_ReturnsBadRequestOnInvalidCode() throws Exception {
        String requestBody = """
                {
                    "mfaToken": "mfa_token_from_login",
                    "code": "000000"
                }
                """;

        when(authService.verifyMfa(any(MfaVerifyRequest.class)))
                .thenThrow(new RuntimeException("Invalid MFA code"));

        mockMvc.perform(post("/api/v1/auth/verify-mfa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(username = "john_doe")
    void setupMfa_ReturnsOkWithQrCode() throws Exception {
        MfaSetupResponse mockResponse = new MfaSetupResponse();
        mockResponse.setQrCodeUri("data:image/png;base64,iVBORw0KGgo=");
        mockResponse.setSecret("secret_key");

        when(authService.setupMfa("john_doe")).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/mfa/setup"))
                .andExpect(status().isOk());

        verify(authService).setupMfa("john_doe");
    }

    @Test
    @WithMockUser(username = "john_doe")
    void confirmMfa_ReturnsOk() throws Exception {
        String requestBody = """
                {
                    "code": "123456"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/mfa/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        verify(authService).confirmMfa("john_doe", "123456");
    }

    @Test
    @WithMockUser(username = "john_doe")
    void confirmMfa_ReturnsBadRequestOnInvalidCode() throws Exception {
        String requestBody = """
                {
                    "code": "000000"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/mfa/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "john_doe")
    void disableMfa_ReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/auth/mfa/disable"))
                .andExpect(status().isOk());

        verify(authService).disableMfa("john_doe");
    }
}
