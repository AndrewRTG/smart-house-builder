package gr.A4.SmartHouseBuilder.team2.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
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
import static org.mockito.Mockito.*;
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

    // ---- POST /save ----

    @Test
    void saveLayout_returnsOkWithId() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("layout-1");

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(42L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string("OK42"));
    }

    @Test
    void saveLayout_callsServiceSaveLayout() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(layoutService, times(1)).saveLayout(any(SetupBuildDTO.class));
    }

    @Test
    void saveLayout_withMinimalPayload_returnsOk() throws Exception {
        when(layoutService.saveLayout(any())).thenReturn(1L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK1"));
    }

    // ---- POST /send ----

    @Test
    void sendLayout_returnsOkWithServiceResponse() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(5L, Instant.now(), dto);
        String externalResponse = "external-ok";

        when(layoutService.saveLayout(any())).thenReturn(5L);
        when(layoutService.getLayoutById(5L)).thenReturn(layout);
        when(layoutService.sendAndReceive(layout)).thenReturn(externalResponse);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("external-ok")));
    }

    @Test
    void sendLayout_whenExternalReturnsNull_returnsOkWithNullBody() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);

        when(layoutService.saveLayout(any())).thenReturn(1L);
        when(layoutService.getLayoutById(1L)).thenReturn(layout);
        when(layoutService.sendAndReceive(layout)).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void sendLayout_callsGetLayoutByIdWithReturnedId() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(7L, Instant.now(), dto);

        when(layoutService.saveLayout(any())).thenReturn(7L);
        when(layoutService.getLayoutById(7L)).thenReturn(layout);
        when(layoutService.sendAndReceive(any())).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(layoutService).getLayoutById(7L);
        verify(layoutService).sendAndReceive(layout);
    }

    // ---- GET /all ----

    @Test
    void getAllLayouts_returnsEmptyList() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void getAllLayouts_returnsLayoutList() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("room-layout");
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);

        when(layoutService.getAllLayouts()).thenReturn(List.of(layout));

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].data.id").value("room-layout"));
    }

    @Test
    void getAllLayouts_returnsMultipleLayouts() throws Exception {
        StoredLayout l1 = new StoredLayout(1L, Instant.now(), new SetupBuildDTO());
        StoredLayout l2 = new StoredLayout(2L, Instant.now(), new SetupBuildDTO());

        when(layoutService.getAllLayouts()).thenReturn(List.of(l1, l2));

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    // ---- GET /view ----

    @Test
    void viewLayoutsAsHtml_returnsHtmlContentType() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
    }

    @Test
    void viewLayoutsAsHtml_containsExpectedHtmlStructure() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<!DOCTYPE html>")))
                .andExpect(content().string(containsString("StoredLayout[]")))
                .andExpect(content().string(containsString("/api/team2/layouts/view")));
    }

    @Test
    void viewLayoutsAsHtml_escapesHtmlInJson() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("<script>alert('xss')</script>");
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);

        when(layoutService.getAllLayouts()).thenReturn(List.of(layout));

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("<script>"))))
                .andExpect(content().string(containsString("&lt;script&gt;")));
    }

    @Test
    void viewLayoutsAsHtml_withMultipleLayouts_rendersAllInPre() throws Exception {
        StoredLayout l1 = new StoredLayout(1L, Instant.now(), new SetupBuildDTO());
        StoredLayout l2 = new StoredLayout(2L, Instant.now(), new SetupBuildDTO());

        when(layoutService.getAllLayouts()).thenReturn(List.of(l1, l2));

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<pre>")))
                .andExpect(content().string(containsString("</pre>")));
    }

    // ---- POST /validate ----

    @Test
    void validateLayout_returnsValidatedDto() throws Exception {
        SetupBuildDTO inputDto = new SetupBuildDTO();
        inputDto.setId("input-layout");

        SetupBuildDTO validatedDto = new SetupBuildDTO();
        validatedDto.setId("validated-layout");
        validatedDto.setScale("1:50");

        StoredLayout layout = new StoredLayout(3L, Instant.now(), inputDto);

        when(layoutService.saveLayout(any())).thenReturn(3L);
        when(layoutService.getLayoutById(3L)).thenReturn(layout);
        when(layoutService.validateLayout(layout)).thenReturn(validatedDto);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inputDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("validated-layout"))
                .andExpect(jsonPath("$.scale").value("1:50"));
    }

    @Test
    void validateLayout_whenValidationReturnsNull_returnsOkWithNullBody() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(2L, Instant.now(), dto);

        when(layoutService.saveLayout(any())).thenReturn(2L);
        when(layoutService.getLayoutById(2L)).thenReturn(layout);
        when(layoutService.validateLayout(layout)).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void validateLayout_callsValidateLayoutWithCorrectLayout() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(10L, Instant.now(), dto);

        when(layoutService.saveLayout(any())).thenReturn(10L);
        when(layoutService.getLayoutById(10L)).thenReturn(layout);
        when(layoutService.validateLayout(any())).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(layoutService).getLayoutById(10L);
        verify(layoutService).validateLayout(layout);
    }
}