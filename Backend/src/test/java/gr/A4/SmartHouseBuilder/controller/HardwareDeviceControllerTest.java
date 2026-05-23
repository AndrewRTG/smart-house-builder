/*package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.DeviceSuggestionAlgorithmService;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import gr.A4.SmartHouseBuilder.service.WizardOptimizerService;
import gr.A4.SmartHouseBuilder.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HardwareDeviceController.class)
@AutoConfigureMockMvc(addFilters = false) // Ignorăm securitatea pentru test
class HardwareDeviceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Mock-uim serviciile folosite de controller
    @MockitoBean
    private WizardOptimizerService wizardOptimizer;

    @MockitoBean
    private SimpleAiService aiService;

    @MockitoBean
    private DeviceSuggestionAlgorithmService algorithmService;

    // Mock-uim utilitarele de securitate (pentru a evita erorile de pornire context)
    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void testGetSuggestions_WithoutRooms() throws Exception {
        // GIVEN: Un criteriu simplu, fără string-ul "Rooms:"
        // Aceasta va forța ramura FALSE a if-ului (criteria.contains("Rooms:"))
        String simpleCriteria = "just a simple light search";
        when(aiService.getSmartSuggestions(eq(simpleCriteria), anyList())).thenReturn(List.of());

        // WHEN & THEN
        mockMvc.perform(get("/api/devices/suggestions")
                        .param("criteria", simpleCriteria))
                .andExpect(status().isOk());

        // Verificăm că aiService a fost apelat cu lista de ID-uri goală
        org.mockito.Mockito.verify(aiService).getSmartSuggestions(eq(simpleCriteria), argThat(List::isEmpty));
    }

    @Test
    void testGetSuggestions_Success() throws Exception {
        // Simulăm un răspuns de la serviciul AI
        HardwareDevice device = new HardwareDevice();
        device.setName("Smart Bulb");
        when(aiService.getSmartSuggestions(anyString(), anyList())).thenReturn(List.of(device));

        // Testăm endpoint-ul cu formatul care include "Rooms:"
        mockMvc.perform(get("/api/devices/suggestions")
                        .param("criteria", "light Rooms:1,2"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetSuggestions_InvalidRoomId() throws Exception {
        // Testăm cazul în care un ID de cameră nu este număr (va declanșa log.error-ul reparat anterior)
        mockMvc.perform(get("/api/devices/suggestions")
                        .param("criteria", "light Rooms:abc,2"))
                .andExpect(status().isOk());
        // Endpoint-ul returnează tot 200 OK pentru că eroarea este prinsă în try-catch
    }

    @Test
    void testGetAlgorithmSuggestions_Success() throws Exception {
        when(algorithmService.getSmartSuggestions(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/devices/algorithmSuggestions")
                        .param("criteria", "budget 500"))
                .andExpect(status().isOk());
    }
}*/