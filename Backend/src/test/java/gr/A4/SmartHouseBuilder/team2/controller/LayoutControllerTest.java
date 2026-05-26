package gr.A4.SmartHouseBuilder.team2.controller;

import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.model.Layout;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.service.LayoutPersistenceService;
import gr.A4.SmartHouseBuilder.team2.service.LayoutService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LayoutControllerTest {

    @Mock
    private LayoutService layoutService;

    @Mock
    private LayoutPersistenceService layoutPersistenceService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LayoutRepository layoutRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private LayoutController controller;

    @Test
    void validateLayout_returnsOkAndDelegatesToService() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);

        ResponseEntity<SetupBuildDTO> response = controller.validateLayout(input);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(validated, response.getBody());
        verify(layoutService).validateLayout(any());
    }

    @Test
    void getLayoutById_returnsSavedLayoutPayload() {
        SetupBuildDTO saved = new SetupBuildDTO();
        saved.setId("layout-1");
        when(layoutPersistenceService.loadAsJson(1)).thenReturn(Optional.of(saved));

        ResponseEntity<SetupBuildDTO> response = controller.getLayoutById(1);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(saved, response.getBody());
    }

    @Test
    void openLayout_returnsSavedLayoutPayload() {
        SetupBuildDTO saved = new SetupBuildDTO();
        saved.setId("layout-open");
        when(layoutPersistenceService.loadAsJson(2)).thenReturn(Optional.of(saved));

        ResponseEntity<SetupBuildDTO> response = controller.openLayout(2);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(saved, response.getBody());
    }

    @Test
    void openLayout_returns404WhenLayoutMissing() {
        when(layoutPersistenceService.loadAsJson(404)).thenReturn(Optional.empty());

        ResponseEntity<SetupBuildDTO> response = controller.openLayout(404);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void openLayout_returns500WhenPayloadCannotBeRead() {
        when(layoutPersistenceService.loadAsJson(5)).thenThrow(new RuntimeException("bad json"));

        ResponseEntity<SetupBuildDTO> response = controller.openLayout(5);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void saveLayout_returns400WhenValidationHasInvalidResult() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        validated.setErrors(List.of(new ValidationResult(false, "ERROR", "nope")));
        when(layoutService.validateLayout(any())).thenReturn(validated);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, null);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(Boolean.FALSE, response.getBody().get("saved"));
        verify(layoutPersistenceService, never()).saveAsJson(any(), any());
    }

    @Test
    void saveLayout_allowsSaveWhenOnlyWarningsPresent() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        validated.setErrors(List.of(new ValidationResult(false, "WARNING", "insufficient lights")));
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(12);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, null);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(Boolean.TRUE, response.getBody().get("saved"));
        verify(layoutPersistenceService).saveAsJson(validated, null);
    }

    @Test
    void saveLayout_persistsAndReturns201_whenNoAuthentication() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        validated.setErrors(List.of(new ValidationResult(true, "INFO", "ok")));
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(11);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, null);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(11, response.getBody().get("id"));
        assertEquals(Boolean.TRUE, response.getBody().get("saved"));
        assertTrue(response.getBody().containsKey("savedAt"));
    }

    @Test
    void saveLayout_resolvesUserIdWhenAuthenticated() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@example.com");

        User user = new User();
        user.setId(77L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(77))).thenReturn(99);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(99, response.getBody().get("id"));
        verify(layoutPersistenceService).saveAsJson(validated, 77);
    }

    @Test
    void saveLayout_passesNullUserIdWhenEmailNotFound() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("missing@example.com");
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(5);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(layoutPersistenceService).saveAsJson(validated, null);
    }

    @Test
    void saveLayout_skipsUserLookupWhenAuthenticationNotAuthenticated() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(authentication.isAuthenticated()).thenReturn(false);
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(42);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(42, response.getBody().get("id"));
        verify(layoutPersistenceService).saveAsJson(validated, null);
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void saveLayout_treatsNullValidationResultEntriesAsValid() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        // anyMatch must short-circuit on null entries (the lambda guards with
        // r != null), so a list that contains only nulls is considered valid.
        validated.setErrors(Arrays.asList((gr.A4.SmartHouseBuilder.model.ValidationResult) null));
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(8);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, null);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(Boolean.TRUE, response.getBody().get("saved"));
    }

    @Test
    void saveLayout_skipsUserLookupWhenEmailIsNull() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(null);
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(4);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void saveLayout_skipsUserLookupWhenEmailIsBlank() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("   ");
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(3);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(layoutPersistenceService).saveAsJson(validated, null);
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void saveLayout_passesNullUserIdWhenUserIdOverflowsInteger() {
        SetupBuildDTO input = new SetupBuildDTO();
        SetupBuildDTO validated = new SetupBuildDTO();
        when(layoutService.validateLayout(any())).thenReturn(validated);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("big@example.com");

        // Long.MAX_VALUE cannot be represented as an int, so Math.toIntExact
        // throws ArithmeticException and the controller must fall back to null.
        User user = new User();
        user.setId(Long.MAX_VALUE);
        when(userRepository.findByEmail("big@example.com")).thenReturn(Optional.of(user));
        when(layoutPersistenceService.saveAsJson(eq(validated), eq(null))).thenReturn(17);

        ResponseEntity<Map<String, Object>> response = controller.saveLayout(input, authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(layoutPersistenceService).saveAsJson(validated, null);
    }

    @Test
    void getLayoutThumbnail_returnsBytesAndPngContentType() {
        byte[] png = new byte[]{1, 2, 3};
        Layout layout = new Layout();
        layout.setThumbnailPng(png);
        when(layoutRepository.findById(10)).thenReturn(Optional.of(layout));

        ResponseEntity<byte[]> response = controller.getLayoutThumbnail(10);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertArrayEquals(png, response.getBody());
        assertEquals(MediaType.IMAGE_PNG, response.getHeaders().getContentType());
    }

    @Test
    void getLayoutThumbnail_returns404WhenLayoutMissing() {
        when(layoutRepository.findById(123)).thenReturn(Optional.empty());

        ResponseEntity<byte[]> response = controller.getLayoutThumbnail(123);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getLayoutThumbnail_returns404WhenThumbnailEmpty() {
        Layout layout = new Layout();
        layout.setThumbnailPng(new byte[0]);
        when(layoutRepository.findById(8)).thenReturn(Optional.of(layout));

        ResponseEntity<byte[]> response = controller.getLayoutThumbnail(8);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getLayoutThumbnail_returns404WhenThumbnailIsNull() {
        // Layout exists but thumbnailPng is null (default) — the filter must
        // short-circuit on `bytes != null` and produce a 404, not an NPE.
        Layout layout = new Layout();
        when(layoutRepository.findById(9)).thenReturn(Optional.of(layout));

        ResponseEntity<byte[]> response = controller.getLayoutThumbnail(9);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
