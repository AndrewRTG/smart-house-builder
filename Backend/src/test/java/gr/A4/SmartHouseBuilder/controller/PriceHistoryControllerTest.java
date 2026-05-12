package gr.A4.SmartHouseBuilder.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.PriceHistoryRequest;
import gr.A4.SmartHouseBuilder.dto.PriceHistoryResponse;
import gr.A4.SmartHouseBuilder.service.PriceHistoryService;
import gr.A4.SmartHouseBuilder.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PriceHistoryController.class)
@AutoConfigureMockMvc(addFilters = false)
public class PriceHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PriceHistoryService priceHistoryService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void addPrice_HappyPath_Returns201() throws Exception {
        LocalDateTime date = LocalDateTime.of(2024, 1, 1, 10, 0);
        PriceHistoryRequest request = new PriceHistoryRequest(1, "eMAG", 150.0, "http://url", date);
        PriceHistoryResponse response = new PriceHistoryResponse(10, 1, "eMAG", 150.0, "http://url", date);

        when(priceHistoryService.addPrice(any(PriceHistoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/prices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.price").value(150.0));
    }

    @Test
    void addPrice_Error_NegativePrice_Returns400() throws Exception {
        LocalDateTime date = LocalDateTime.of(2024, 1, 1, 10, 0);
        PriceHistoryRequest request = new PriceHistoryRequest(1, "eMAG", -50.0, "http://url", date);

        mockMvc.perform(post("/api/prices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addPrice_EdgeCase_FutureDate_Returns400() throws Exception {
        LocalDateTime futureDate = LocalDateTime.now().plusDays(10);
        PriceHistoryRequest request = new PriceHistoryRequest(1, "Altex", 100.0, "http://url", futureDate);

        mockMvc.perform(post("/api/prices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}