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

    // ── POST /api/team2/layouts/save ──────────────────────────────────────────

    @Test
    void saveLayout_returns200WithOkAndId() throws Exception {
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(42L);

        String body = objectMapper.writeValueAsString(minimalSetupBuildDTO());

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(content().string("OK42"));
    }

    @Test
    void saveLayout_returnsOkPrefixedWithId() throws Exception {
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetupBuildDTO())))
                .andExpect(status().isOk())
                .andExpect(content().string(startsWith("OK")));
    }

    @Test
    void saveLayout_callsServiceOnce() throws Exception {
        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(1L);

        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetupBuildDTO())))
                .andExpect(status().isOk());

        verify(layoutService, times(1)).saveLayout(any(SetupBuildDTO.class));
    }

    @Test
    void saveLayout_withNonJsonBody_returns400() throws Exception {
        mockMvc.perform(post("/api/team2/layouts/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("not-valid-json"))
                .andExpect(status().is4xxClientError());
    }

    // ── POST /api/team2/layouts/send ──────────────────────────────────────────

    @Test
    void sendLayout_returns200WithRemoteResponse() throws Exception {
        Long savedId = 7L;
        StoredLayout storedLayout = new StoredLayout(savedId, Instant.now(), minimalSetupBuildDTO());
        Object remoteResponse = "remote-ok";

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(savedId);
        when(layoutService.getLayoutById(savedId)).thenReturn(storedLayout);
        when(layoutService.sendAndReceive(storedLayout)).thenReturn(remoteResponse);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(minimalSetupBuildDTO())))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("remote-ok")));
    }

    @Test
    void sendLayout_whenRemoteReturnsNull_returns200WithNullBody() throws Exception {
        Long savedId = 3L;
        StoredLayout storedLayout = new StoredLayout(savedId, Instant.now(), new SetupBuildDTO());

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(savedId);
        when(layoutService.getLayoutById(savedId)).thenReturn(storedLayout);
        when(layoutService.sendAndReceive(storedLayout)).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetupBuildDTO())))
                .andExpect(status().isOk());
    }

    @Test
    void sendLayout_invokesGetLayoutByIdWithCorrectId() throws Exception {
        Long savedId = 5L;
        StoredLayout storedLayout = new StoredLayout(savedId, Instant.now(), new SetupBuildDTO());

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(savedId);
        when(layoutService.getLayoutById(savedId)).thenReturn(storedLayout);
        when(layoutService.sendAndReceive(any())).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetupBuildDTO())))
                .andExpect(status().isOk());

        verify(layoutService).getLayoutById(savedId);
        verify(layoutService).sendAndReceive(storedLayout);
    }

    // ── GET /api/team2/layouts/all ────────────────────────────────────────────

    @Test
    void getAllLayouts_returnsEmptyJsonArrayWhenNoLayouts() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getAllLayouts_returnsJsonArrayWithAllLayouts() throws Exception {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        dto1.setId("layout-a");
        SetupBuildDTO dto2 = new SetupBuildDTO();
        dto2.setId("layout-b");

        List<StoredLayout> layouts = List.of(
                new StoredLayout(1L, Instant.now(), dto1),
                new StoredLayout(2L, Instant.now(), dto2)
        );
        when(layoutService.getAllLayouts()).thenReturn(layouts);

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[1].id", is(2)));
    }

    @Test
    void getAllLayouts_returns200() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/all"))
                .andExpect(status().isOk());
    }

    // ── GET /api/team2/layouts/view ───────────────────────────────────────────

    @Test
    void viewLayoutsAsHtml_returnsHtmlContentType() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
    }

    @Test
    void viewLayoutsAsHtml_containsDocTypeAndTitle() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<!DOCTYPE html>")))
                .andExpect(content().string(containsString("<title>")));
    }

    @Test
    void viewLayoutsAsHtml_containsPreElement() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("<pre>")));
    }

    @Test
    void viewLayoutsAsHtml_escapesSpecialCharactersInJson() throws Exception {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("<script>alert('xss')</script>");

        List<StoredLayout> layouts = List.of(new StoredLayout(1L, Instant.now(), dto));
        when(layoutService.getAllLayouts()).thenReturn(layouts);

        String html = mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // The raw script tag should be HTML-escaped, not present verbatim
        org.assertj.core.api.Assertions.assertThat(html)
                .doesNotContain("<script>alert")
                .contains("&lt;script&gt;");
    }

    @Test
    void viewLayoutsAsHtml_containsEndpointReference() throws Exception {
        when(layoutService.getAllLayouts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/team2/layouts/view"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("/api/team2/layouts/view")));
    }

    // ── POST /api/team2/layouts/validate ──────────────────────────────────────

    @Test
    void validateLayout_returns200WithValidatedDto() throws Exception {
        Long savedId = 9L;
        SetupBuildDTO inputDto = minimalSetupBuildDTO();
        SetupBuildDTO validatedDto = new SetupBuildDTO();
        validatedDto.setId("validated-id");
        StoredLayout storedLayout = new StoredLayout(savedId, Instant.now(), inputDto);

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(savedId);
        when(layoutService.getLayoutById(savedId)).thenReturn(storedLayout);
        when(layoutService.validateLayout(storedLayout)).thenReturn(validatedDto);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inputDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("validated-id")));
    }

    @Test
    void validateLayout_whenServiceReturnsNull_returns200WithNullBody() throws Exception {
        Long savedId = 11L;
        StoredLayout storedLayout = new StoredLayout(savedId, Instant.now(), new SetupBuildDTO());

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(savedId);
        when(layoutService.getLayoutById(savedId)).thenReturn(storedLayout);
        when(layoutService.validateLayout(storedLayout)).thenReturn(null);

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetupBuildDTO())))
                .andExpect(status().isOk());
    }

    @Test
    void validateLayout_invokesServiceChainInOrder() throws Exception {
        Long savedId = 15L;
        StoredLayout storedLayout = new StoredLayout(savedId, Instant.now(), new SetupBuildDTO());

        when(layoutService.saveLayout(any(SetupBuildDTO.class))).thenReturn(savedId);
        when(layoutService.getLayoutById(savedId)).thenReturn(storedLayout);
        when(layoutService.validateLayout(storedLayout)).thenReturn(new SetupBuildDTO());

        mockMvc.perform(post("/api/team2/layouts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetupBuildDTO())))
                .andExpect(status().isOk());

        var inOrder = inOrder(layoutService);
        inOrder.verify(layoutService).saveLayout(any());
        inOrder.verify(layoutService).getLayoutById(savedId);
        inOrder.verify(layoutService).validateLayout(storedLayout);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private SetupBuildDTO minimalSetupBuildDTO() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("test-layout");
        dto.setScale("1:100");
        dto.setMaxBudget(1000.0);
        return dto;
    }
}