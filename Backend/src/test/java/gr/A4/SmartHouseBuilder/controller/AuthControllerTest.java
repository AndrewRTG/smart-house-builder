package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.AuthService;
import gr.A4.SmartHouseBuilder.service.MfaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Test
    void verifyMfa_ReturnsOk() throws Exception {
      
        String requestBody = """
                {
                    "mfaToken": "un_token_generat_la_login",
                    "code": "123456"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/verify-mfa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());


        verify(authService).verifyMfa(any());
    }

    @Test
    @WithMockUser(username = "alexandra")
    void setupMfa_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/v1/auth/mfa/setup"))
                .andExpect(status().isOk());

        verify(authService).setupMfa("alexandra");
    }

    @Test
    @WithMockUser(username = "alexandra")
    void confirmMfa_ReturnsOk() throws Exception {

        String requestBody = """
                {
                    "code": "987654"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/mfa/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());


        verify(authService).confirmMfa("alexandra", "987654");
    }

    @Test
    @WithMockUser(username = "alexandra") // Simulăm utilizatorul logat care își dezactivează MFA
    void disableMfa_ReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/v1/auth/mfa/disable"))
                .andExpect(status().isOk());

        verify(authService).disableMfa("alexandra");
    }
}