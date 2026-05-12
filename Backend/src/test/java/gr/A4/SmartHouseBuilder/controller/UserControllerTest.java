package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.UserProfileResponse;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private AuthService authService;
    @MockitoBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockitoBean private UserDetailsServiceImpl userDetailsService;

    private UserProfileResponse profile(String username, String email) {
        return UserProfileResponse.builder()
                .id(1L)
                .username(username)
                .email(email)
                .mfaEnabled(false)
                .verified(true)
                .build();
    }

    @Test
    @WithMockUser(username = "u@e")
    void updateUsername_returnsUpdatedProfile() throws Exception {
        when(authService.updateUsername(eq("u@e"), eq("new"))).thenReturn(profile("new", "u@e"));

        mockMvc.perform(put("/api/v1/users/username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newUsername\":\"new\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("new"));

        verify(authService).updateUsername("u@e", "new");
    }

    @Test
    void updateUsername_returns401WhenAnonymous() throws Exception {
        mockMvc.perform(put("/api/v1/users/username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newUsername\":\"new\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "u@e")
    void updateUsername_returns400WhenServiceFails() throws Exception {
        when(authService.updateUsername(eq("u@e"), eq("taken")))
                .thenThrow(new RuntimeException("Username is already taken"));

        mockMvc.perform(put("/api/v1/users/username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newUsername\":\"taken\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "u@e")
    void updateEmail_returnsUpdatedProfile() throws Exception {
        when(authService.updateEmail(eq("u@e"), eq("new@e"))).thenReturn(profile("u", "new@e"));

        mockMvc.perform(put("/api/v1/users/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"new@e\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new@e"));

        verify(authService).updateEmail("u@e", "new@e");
    }

    @Test
    void updateEmail_returns401WhenAnonymous() throws Exception {
        mockMvc.perform(put("/api/v1/users/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"new@e\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "u@e")
    void updateEmail_returns400OnDuplicate() throws Exception {
        when(authService.updateEmail(eq("u@e"), eq("dup@e")))
                .thenThrow(new RuntimeException("Email is already in use"));

        mockMvc.perform(put("/api/v1/users/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"dup@e\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "u@e")
    void toggleMfa_returnsUpdatedProfile() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L).username("u").email("u@e").mfaEnabled(true).verified(true).build();
        when(authService.toggleMfa("u@e")).thenReturn(response);

        mockMvc.perform(post("/api/v1/users/mfa/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(true));

        verify(authService).toggleMfa("u@e");
    }

    @Test
    @WithMockUser(username = "u@e")
    void updateAvatar_returnsUpdatedProfile() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
                .id(1L).username("u").email("u@e").avatarUrl("https://s3/img.jpg").build();
        when(authService.updateAvatar(eq("u@e"), eq("https://s3/img.jpg"))).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarUrl\":\"https://s3/img.jpg\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value("https://s3/img.jpg"));

        verify(authService).updateAvatar("u@e", "https://s3/img.jpg");
    }

    @Test
    void updateAvatar_returns401WhenAnonymous() throws Exception {
        mockMvc.perform(put("/api/v1/users/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarUrl\":\"https://s3/img.jpg\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "u@e")
    void updateAvatar_rejectsInvalidUrl() throws Exception {
        mockMvc.perform(put("/api/v1/users/avatar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarUrl\":\"not-a-url\"}"))
                .andExpect(status().isBadRequest());
    }
}
