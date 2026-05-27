package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.security.JwtUtil;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AiController.class)
@AutoConfigureMockMvc(addFilters = false) // Dezactivează interceptarea reală a request-urilor
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SimpleAiService aiService;

    // --- REZOLVAREA ERORII DE SECURITATE ---
    // Oferim "machete" (mocks) pentru componentele de securitate
    // ca Spring să poată construi JwtAuthenticationFilter cu succes.
    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsService userDetailsService;
    // ---------------------------------------

    @Test
    void testGemini_ReturnsExpectedString() throws Exception {
        // Arrange
        String mockResponse = "Răspuns test de la Gemini";
        when(aiService.askGemini(anyString())).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/ai/test")
                        .param("message", "Salut"))
                .andExpect(status().isOk())
                .andExpect(content().string(mockResponse));
    }

    @Test
    void performAgenticSearch_ValidRequest_ReturnsOkWithDevices() throws Exception {
        // Arrange
        HardwareDevice device = new HardwareDevice();
        device.setId(10L);
        device.setName("Smart TV Test");

        List<HardwareDevice> devices = List.of(device);

        when(aiService.searchWithAgent("Vreau un televizor", "sufragerie")).thenReturn(devices);

        String jsonRequest = """
                {
                    "prompt": "Vreau un televizor",
                    "context": "sufragerie"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/ai/agent-search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.devices").isArray())
                .andExpect(jsonPath("$.devices[0].id").value(10))
                .andExpect(jsonPath("$.devices[0].name").value("Smart TV Test"));
    }

    @Test
    void performAgenticSearch_EmptyPrompt_ReturnsBadRequest() throws Exception {
        // Arrange
        String jsonRequest = """
                {
                    "prompt": "   ",
                    "context": "sufragerie"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/ai/agent-search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Prompt-ul nu poate fi gol."));
    }

    @Test
    void performAgenticSearch_MissingPrompt_ReturnsBadRequest() throws Exception {
        // Arrange
        String jsonRequest = """
                {
                    "context": "sufragerie"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/ai/agent-search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Prompt-ul nu poate fi gol."));
    }

    @Test
    void performAgenticSearch_ServiceThrowsException_ReturnsInternalServerError() throws Exception {
        // Arrange
        String jsonRequest = """
                {
                    "prompt": "Vreau ceva care strică serverul",
                    "context": ""
                }
                """;

        when(aiService.searchWithAgent(anyString(), anyString()))
                .thenThrow(new RuntimeException("OpenAI timeout"));

        // Act & Assert
        mockMvc.perform(post("/api/ai/agent-search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Eroare la procesarea AI: OpenAI timeout"));
    }
}