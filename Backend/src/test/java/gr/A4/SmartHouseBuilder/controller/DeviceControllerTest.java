package gr.A4.SmartHouseBuilder.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.DeviceRequest;
import gr.A4.SmartHouseBuilder.dto.DeviceResponse;
import gr.A4.SmartHouseBuilder.dto.OfferResponse;
import gr.A4.SmartHouseBuilder.exception.ResourceNotFoundException;
import gr.A4.SmartHouseBuilder.security.JwtAuthenticationFilter;
import gr.A4.SmartHouseBuilder.security.OAuth2LoginSuccessHandler;
import gr.A4.SmartHouseBuilder.security.RateLimitingFilter;
import gr.A4.SmartHouseBuilder.security.UserDetailsServiceImpl;
import gr.A4.SmartHouseBuilder.service.DeviceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DeviceController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DeviceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DeviceService deviceService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private RateLimitingFilter rateLimitingFilter;

    @MockitoBean
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/devices - Caz fericit: Returnează o listă de device-uri filtrată")
    void getAllDevices_ShouldReturn200() throws Exception {
        DeviceResponse deviceResponse = new DeviceResponse(
                1, 1, "Iluminat", "Bec Inteligent", "Philips",
                "Bec color", "url.jpg", "WiFi",
                Map.of("power", "10W"),
                50.0, "store.com/bec"
        );

        when(deviceService.getFilteredDevices(any(), any(), any(), any(), any(), eq("date"), eq("desc")))
                .thenReturn(List.of(deviceResponse));

        mockMvc.perform(get("/api/devices")
                        .param("sortBy", "date")
                        .param("sortDir", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].name").value("Bec Inteligent"))
                .andExpect(jsonPath("$[0].brand").value("Philips"));
    }

    @Test
    @DisplayName("POST /api/devices - Caz fericit: Returnează 201 la cerere validă")
    void createDevice_ValidRequest_ShouldReturn201() throws Exception {
        DeviceRequest request = new DeviceRequest(
                1, "Bec Inteligent", "Philips", "Bec color",
                "url.jpg", "WiFi",
                Map.of("power", "10W")
        );

        DeviceResponse response = new DeviceResponse(
                1, 1, "Iluminat", "Bec Inteligent", "Philips",
                "Bec color", "url.jpg", "WiFi",
                Map.of("power", "10W"),
                null, null
        );

        when(deviceService.createDevice(any(DeviceRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Bec Inteligent"));
    }

    @Test
    @DisplayName("POST /api/devices - Caz de eroare limită: Returnează 400 dacă lipsește CategoryId")
    void createDevice_InvalidRequest_ShouldReturn400() throws Exception {
        DeviceRequest invalidRequest = new DeviceRequest(
                null, "Bec", "Philips", "Descriere", null, null, null
        );

        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/devices/suggest - Returnează 200 cu sugestie corectă")
    void getSearchSuggestion_ShouldReturn200() throws Exception {
        when(deviceService.getSearchSuggestion("phi")).thenReturn("Philips");

        mockMvc.perform(get("/api/devices/suggest").param("q", "phi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestion").value("Philips"));
    }

    @Test
    @DisplayName("GET /api/devices/{id}/offers - Caz fericit: Returnează ofertele agregate")
    void getDeviceOffers_ShouldReturn200() throws Exception {
        List<OfferResponse> mockOffers = List.of(
                new OfferResponse("PC Garage", 145.0, "pcgarage.ro/produs", LocalDateTime.now()),
                new OfferResponse("eMAG", 150.0, "emag.ro/produs", LocalDateTime.now())
        );

        when(deviceService.getDeviceOffers(1)).thenReturn(mockOffers);

        mockMvc.perform(get("/api/devices/{id}/offers", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].storeName").value("PC Garage"))
                .andExpect(jsonPath("$[0].price").value(145.0))
                .andExpect(jsonPath("$[1].storeName").value("eMAG"))
                .andExpect(jsonPath("$[1].price").value(150.0));
    }

    @Test
    @DisplayName("GET /api/devices/{id}/offers - Caz de eroare: Returnează 404 dacă device-ul nu există")
    void getDeviceOffers_ShouldReturn404_WhenDeviceNotFound() throws Exception {
        when(deviceService.getDeviceOffers(99)).thenThrow(new ResourceNotFoundException("Device-ul cu ID 99 nu a fost găsit!"));

        mockMvc.perform(get("/api/devices/{id}/offers", 99))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/devices/{id}/offers - Caz limită: Returnează o listă goală dacă nu sunt oferte")
    void getDeviceOffers_ShouldReturn200AndEmptyList_WhenNoOffers() throws Exception {
        when(deviceService.getDeviceOffers(2)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/devices/{id}/offers", 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(0))
                .andExpect(jsonPath("$").isArray());
    }
}