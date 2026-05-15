package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.entity.Notification;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.service.NotificationService;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean private NotificationService notificationService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockitoBean private UserDetailsServiceImpl userDetailsService;

    // @WithMockUser sets the principal's "username" field to "alexandra".
    // UserDetailsServiceImpl stores the email there, so the controller calls
    // userRepository.findByEmail("alexandra") to resolve the display username.
    private static final User MOCK_USER = User.builder()
            .id(1L).email("alexandra").username("alexandra").build();

    @BeforeEach
    void stubUserLookup() {
        when(userRepository.findByEmail("alexandra")).thenReturn(Optional.of(MOCK_USER));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getMyNotifications_ReturnsPaginatedNotifications() throws Exception {
        Notification notif = new Notification("alexandra", "Cineva a dat like!");
        var expectedPage = new PageImpl<>(List.of(notif));

        when(notificationService.getUserNotifications(eq("alexandra"), any(PageRequest.class)))
                .thenReturn(expectedPage);

        mockMvc.perform(get("/api/v1/notifications")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].message").value("Cineva a dat like!"))
                .andExpect(jsonPath("$.content[0].username").value("alexandra"));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void getUnreadCount_ReturnsCount() throws Exception {
        when(notificationService.countUnread("alexandra")).thenReturn(3L);

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(3));
    }

    @Test
    @WithMockUser(username = "alexandra")
    void markAsRead_CallsServiceAndReturnsOk() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/1/read"))
                .andExpect(status().isOk());

        verify(notificationService).markAsReadIfOwner(1L, "alexandra");
    }

    @Test
    @WithMockUser(username = "alexandra")
    void markAllAsRead_CallsServiceAndReturnsOk() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/read-all"))
                .andExpect(status().isOk());

        verify(notificationService).markAllAsRead("alexandra");
    }
}
