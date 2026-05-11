package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import gr.A4.SmartHouseBuilder.security.JwtUtil; // Importă JwtUtil-ul tău
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.core.userdetails.UserDetailsService; // Dacă e nevoie

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiController.class)
@AutoConfigureMockMvc(addFilters = false) // Spunem MockMvc să ignore filtrele de securitate
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SimpleAiService aiService;

    // REZOLVARE: Adăugăm Mock-uri pentru utilitarele de securitate care blochează pornirea contextului
    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void testTestGemini_Endpoint() throws Exception {
        String mockResponse = "Acesta este un răspuns de la AI.";
        when(aiService.askGemini(anyString())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/ai/test")
                        .param("message", "Salut"))
                .andExpect(status().isOk())
                .andExpect(content().string(mockResponse));
    }

    @Test
    void testTestGemini_MissingParam() throws Exception {
        mockMvc.perform(get("/api/ai/test"))
                .andExpect(status().isBadRequest());
    }
}