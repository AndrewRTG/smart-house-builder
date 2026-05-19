package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.NotificationPreferenceDto;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.NotificationPreferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = NotificationPreferenceController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class NotificationPreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean private NotificationPreferenceService preferenceService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockitoBean private UserDetailsServiceImpl userDetailsService;

    private static final User MOCK_USER = User.builder()
            .id(1L).email("alex@test.com").username("alex").build();

    @Test
    @WithMockUser(username = "alex@test.com")
    void getPreferences_returnsCurrentUserPreferences() throws Exception {
        when(userRepository.findByEmail("alex@test.com")).thenReturn(Optional.of(MOCK_USER));
        when(preferenceService.getPreference(1L)).thenReturn(
                NotificationPreferenceDto.builder()
                        .emailOnComment(true).emailOnReply(true)
                        .emailOnLike(false).emailOnWishlist(false).build());

        mockMvc.perform(get("/api/v1/user/notification-preferences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailOnComment").value(true))
                .andExpect(jsonPath("$.emailOnReply").value(true))
                .andExpect(jsonPath("$.emailOnLike").value(false))
                .andExpect(jsonPath("$.emailOnWishlist").value(false));
    }

    @Test
    @WithMockUser(username = "alex@test.com")
    void updatePreferences_persistsAndReturnsUpdated() throws Exception {
        String body = """
                {
                  "emailOnComment": false,
                  "emailOnReply": true,
                  "emailOnLike": true,
                  "emailOnWishlist": true
                }
                """;
        when(userRepository.findByEmail("alex@test.com")).thenReturn(Optional.of(MOCK_USER));
        when(preferenceService.updatePreference(eq(1L), any(NotificationPreferenceDto.class)))
                .thenReturn(NotificationPreferenceDto.builder()
                        .emailOnComment(false).emailOnReply(true)
                        .emailOnLike(true).emailOnWishlist(true).build());

        mockMvc.perform(put("/api/v1/user/notification-preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailOnComment").value(false))
                .andExpect(jsonPath("$.emailOnLike").value(true))
                .andExpect(jsonPath("$.emailOnWishlist").value(true));

        verify(preferenceService).updatePreference(eq(1L), any(NotificationPreferenceDto.class));
    }

    @Test
    void getPreferences_returns401WhenAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/user/notification-preferences"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updatePreferences_returns401WhenAnonymous() throws Exception {
        mockMvc.perform(put("/api/v1/user/notification-preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
