package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;


    @MockitoBean
    private DeviceRepository deviceRepository;

    @MockitoBean
    private SetupRepository setupRepository;

    @MockitoBean
    private ArticleRepository articleRepository;

    @MockitoBean
    private UserRepository userRepository;


    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void seedDevices_ReturnsOkAndSavesDevices() throws Exception {
        mockMvc.perform(post("/api/v1/admin/seed-devices"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Seeded 10 test devices successfully")));


        verify(deviceRepository).saveAll(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void seedSetups_ReturnsOkAndSavesSetups() throws Exception {

        User demoUser = new User();
        demoUser.setUsername("demo");
        when(userRepository.findByUsername("demo")).thenReturn(Optional.of(demoUser));


        mockMvc.perform(post("/api/v1/admin/seed-setups"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Seeded 5 test setups successfully")));

        verify(setupRepository).saveAll(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void seedArticles_ReturnsOkAndSavesArticles() throws Exception {

        User demoUser = new User();
        demoUser.setUsername("demo");
        when(userRepository.findByUsername("demo")).thenReturn(Optional.of(demoUser));


        mockMvc.perform(post("/api/v1/admin/seed-articles"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Seeded 5 test articles successfully")));

        verify(articleRepository).saveAll(any());
    }
}