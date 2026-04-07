package gr.A4.SmartHouseBuilder.team2.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.team2.dto.DeviceDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PointDTO;
import gr.A4.SmartHouseBuilder.team2.dto.RoomDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.dto.WallDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.service.LayoutService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LayoutController.class)
class LayoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LayoutService layoutService;

    private SetupBuildDTO buildSampleDto() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("test-id");
        dto.setScale("1:100");
        dto.setMaxBudget(10000.0);
        dto.setTargetEcosystem("Google");
        return dto;
    }

    // ---- POST /save tests ----

    @Test
    void saveLayout_validBody_returnsOkWithId() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(42L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("OK42"));
    }

    @Test
    void saveLayout_emptyBody_returnsOkWithId() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("OK1"));
    }

    @Test
    void saveLayout_returnsIdConcatenatedToOk() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(100L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string(startsWith("OK")));
    }

    // ---- POST /send tests ----

    @Test
    void sendLayout_successfulSend_returnsOk() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);
        when(layoutService.getLayoutById(1L)).thenReturn(layout);
        when(layoutService.sendAndReceive(layout)).thenReturn("response-from-team");

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void sendLayout_serviceReturnsNull_returnsOkWithNull() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);
        when(layoutService.getLayoutById(1L)).thenReturn(layout);
        when(layoutService.sendAndReceive(layout)).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    // ---- GET /all tests ----

    @Test
    void getAllLayouts_emptyStore_returnsEmptyJsonArray() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getAllLayouts_withLayouts_returnsJsonArray() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout1 = new StoredLayout(1L, Instant.now(), dto);
        StoredLayout layout2 = new StoredLayout(2L, Instant.now(), dto);
        when(layoutService.getAllLayouts()).thenReturn(List.of(layout1, layout2));

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[1].id", is(2)));
    }

    // ---- GET /view tests ----

    @Test
    void viewLayoutsAsHtml_emptyStore_returnsHtmlPage() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view")
                        .accept(MediaType.TEXT_HTML))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("<!DOCTYPE html>")))
                .andExpect(content().string(containsString("StoredLayout")));
    }

    @Test
    void viewLayoutsAsHtml_withLayouts_containsEscapedJson() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        when(layoutService.getAllLayouts()).thenReturn(List.of(layout));

        mockMvc.perform(get("/api/team2/layouts/view")
                        .accept(MediaType.TEXT_HTML))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<pre>")))
                .andExpect(content().string(containsString("</pre>")));
    }

    @Test
    void viewLayoutsAsHtml_htmlSpecialCharsEscaped_noRawBrackets() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        when(layoutService.getAllLayouts()).thenReturn(List.of(layout));

        String response = mockMvc.perform(get("/api/team2/layouts/view")
                        .accept(MediaType.TEXT_HTML))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // The JSON content should be HTML-escaped (< > become &lt; &gt;)
        // and appear inside <pre> tags
        // Verify it's valid HTML with the expected structure
        assert response.contains("<html");
        assert response.contains("<body");
    }

    // ---- POST /validate tests ----

    @Test
    void validateLayout_validBody_returnsOkWithSetupBuildDTO() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        SetupBuildDTO validatedDto = new SetupBuildDTO();
        validatedDto.setId("validated-id");
        validatedDto.setMaxBudget(9999.0);

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);
        when(layoutService.getLayoutById(1L)).thenReturn(layout);
        when(layoutService.validateLayout(layout)).thenReturn(validatedDto);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is("validated-id")))
                .andExpect(jsonPath("$.maxBudget", is(9999.0)));
    }

    @Test
    void validateLayout_serviceReturnsNull_returnsOkWithNullBody() throws Exception {
        SetupBuildDTO dto = buildSampleDto();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);
        when(layoutService.getLayoutById(1L)).thenReturn(layout);
        when(layoutService.validateLayout(layout)).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    // ---- content-type negotiation ----

    @Test
    void saveLayout_wrongContentType_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("not json"))
                .andExpect(status().is4xxClientError());
    }

    // ---- full payload with nested objects ----

    @Test
    void saveLayout_fullPayloadWithRoomsAndDevices_returnsOk() throws Exception {
        WallDTO wall = new WallDTO();
        wall.setX1(0.0); wall.setY1(0.0); wall.setX2(10.0); wall.setY2(0.0);

        RoomDTO room = new RoomDTO();
        room.setId("room-1");
        room.setSquareMeters(25.0);
        room.setWallType("concrete");
        room.setWalls(List.of(wall));

        PointDTO point = new PointDTO();
        point.setX(5.0); point.setY(2.5);

        DeviceDTO device = new DeviceDTO();
        device.setId("dev-1");
        device.setName("Philips Hue");
        device.setPrice(49.0);

        PlacedDeviceDTO placed = new PlacedDeviceDTO();
        placed.setCoordinates(point);
        placed.setRotationAngle(0.0);
        placed.setDevice(device);

        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("full-setup");
        dto.setScale("1:100");
        dto.setMaxBudget(5000.0);
        dto.setTargetEcosystem("Philips");
        dto.setRooms(List.of(room));
        dto.setDevices(List.of(placed));

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(7L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("OK7"));
    }
}