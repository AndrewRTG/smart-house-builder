package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.security.JwtUtil;
import gr.A4.SmartHouseBuilder.service.DeviceSuggestionAlgorithmService;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import gr.A4.SmartHouseBuilder.service.WizardOptimizerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HardwareDeviceController.class)
@AutoConfigureMockMvc(addFilters = false) // Ignorăm filtrele de securitate pentru testele unitare
class HardwareDeviceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Mocăm dependențele controller-ului
    @MockitoBean
    private WizardOptimizerService wizardOptimizer;

    @MockitoBean
    private SimpleAiService aiService;

    @MockitoBean
    private DeviceSuggestionAlgorithmService algorithmService;

    // Mocăm clasele de securitate pentru ca Spring să poată inițializa contextul fără erori
    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsService userDetailsService;

    // =========================================================================
    // TESTE PENTRU: GET /api/devices/algorithmSuggestions
    // =========================================================================

    @Test
    void getAlgorithmSuggestions_ReturnsDeviceList() throws Exception {
        // Arrange
        HardwareDevice mockDevice = new HardwareDevice();
        mockDevice.setId(99L);
        mockDevice.setName("Algorithmic Smart Plug");

        // Când controlerul apelează serviciul, returnăm lista noastră de test
        when(algorithmService.getSmartSuggestions(anyString())).thenReturn(List.of(mockDevice));

        // Act & Assert
        mockMvc.perform(get("/api/devices/algorithmSuggestions")
                        .param("criteria", "confort și siguranță")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(99))
                .andExpect(jsonPath("$[0].name").value("Algorithmic Smart Plug"));

        // Verificăm că serviciul a fost apelat cu parametrul corect
        verify(algorithmService).getSmartSuggestions("confort și siguranță");
    }

    @Test
    void getAlgorithmSuggestions_EmptyResult_ReturnsEmptyArray() throws Exception {
        // Arrange
        when(algorithmService.getSmartSuggestions(anyString())).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/devices/algorithmSuggestions")
                        .param("criteria", "ceva inexistent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty()); // Verificăm că array-ul e gol
    }

    @Test
    void getAlgorithmSuggestions_MissingCriteria_ReturnsBadRequest() throws Exception {
        // Act & Assert
        // Nu trimitem parametrul obligatoriu "@RequestParam String criteria"
        // Ne așteptăm ca Spring să returneze automat 400 Bad Request
        mockMvc.perform(get("/api/devices/algorithmSuggestions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}