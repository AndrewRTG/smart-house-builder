package gr.A4.SmartHouseBuilder.team2.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.model.Layout;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LayoutPersistenceServiceTest {

    @Mock
    private LayoutRepository layoutRepository;

    private ObjectMapper objectMapper;
    private LayoutPersistenceService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new LayoutPersistenceService(layoutRepository, objectMapper);
    }

    @Test
    void saveAsJson_persistsLayoutWithoutThumbnail_andReturnsId() {
        SetupBuildDTO dto = new SetupBuildDTO();
        when(layoutRepository.save(any(Layout.class)))
                .thenAnswer(invocation -> {
                    Layout l = invocation.getArgument(0);
                    l.setId(42);
                    return l;
                });

        Integer id = service.saveAsJson(dto);

        assertEquals(42, id);

        ArgumentCaptor<Layout> captor = ArgumentCaptor.forClass(Layout.class);
        org.mockito.Mockito.verify(layoutRepository).save(captor.capture());
        Layout saved = captor.getValue();
        assertNotNull(saved.getDrawing());
        assertNull(saved.getUserId());
        assertNull(saved.getThumbnailPng());
    }

    @Test
    void saveAsJson_clearsThumbnailFromJsonPayload() {
        SetupBuildDTO dto = new SetupBuildDTO();
        byte[] png = "fake-png-bytes".getBytes(StandardCharsets.UTF_8);
        dto.setThumbnailPngBase64(Base64.getEncoder().encodeToString(png));

        when(layoutRepository.save(any(Layout.class)))
                .thenAnswer(invocation -> {
                    Layout l = invocation.getArgument(0);
                    l.setId(7);
                    return l;
                });

        Integer id = service.saveAsJson(dto, 5);

        assertEquals(7, id);
        ArgumentCaptor<Layout> captor = ArgumentCaptor.forClass(Layout.class);
        org.mockito.Mockito.verify(layoutRepository).save(captor.capture());
        Layout saved = captor.getValue();

        assertEquals(5, saved.getUserId());
        assertArrayEquals(png, saved.getThumbnailPng());
        // payload-ul serializat nu mai conține base64-ul thumbnail-ului
        org.junit.jupiter.api.Assertions.assertFalse(
                saved.getDrawing().contains(Base64.getEncoder().encodeToString(png)));
    }

    @Test
    void saveAsJson_acceptsDataUrlThumbnail() {
        SetupBuildDTO dto = new SetupBuildDTO();
        byte[] png = new byte[]{1, 2, 3, 4, 5};
        String dataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
        dto.setThumbnailPngBase64(dataUrl);

        when(layoutRepository.save(any(Layout.class)))
                .thenAnswer(invocation -> {
                    Layout l = invocation.getArgument(0);
                    l.setId(1);
                    return l;
                });

        service.saveAsJson(dto, null);

        ArgumentCaptor<Layout> captor = ArgumentCaptor.forClass(Layout.class);
        org.mockito.Mockito.verify(layoutRepository).save(captor.capture());
        assertArrayEquals(png, captor.getValue().getThumbnailPng());
    }

    @Test
    void saveAsJson_returnsNullThumbnailForInvalidBase64() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setThumbnailPngBase64("nu-e-base64-valid!!!");

        when(layoutRepository.save(any(Layout.class)))
                .thenAnswer(invocation -> {
                    Layout l = invocation.getArgument(0);
                    l.setId(2);
                    return l;
                });

        service.saveAsJson(dto);

        ArgumentCaptor<Layout> captor = ArgumentCaptor.forClass(Layout.class);
        org.mockito.Mockito.verify(layoutRepository).save(captor.capture());
        assertNull(captor.getValue().getThumbnailPng());
    }

    @Test
    void saveAsJson_returnsNullThumbnailForBlankInput() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setThumbnailPngBase64("   ");

        when(layoutRepository.save(any(Layout.class)))
                .thenAnswer(invocation -> {
                    Layout l = invocation.getArgument(0);
                    l.setId(3);
                    return l;
                });

        service.saveAsJson(dto);

        ArgumentCaptor<Layout> captor = ArgumentCaptor.forClass(Layout.class);
        org.mockito.Mockito.verify(layoutRepository).save(captor.capture());
        assertNull(captor.getValue().getThumbnailPng());
    }

    @Test
    void saveAsJson_wrapsJsonProcessingExceptionInRuntime() throws Exception {
        ObjectMapper failingMapper = org.mockito.Mockito.mock(ObjectMapper.class);
        when(failingMapper.writeValueAsString(any()))
                .thenThrow(new JsonProcessingException("boom") {});

        LayoutPersistenceService failingService =
                new LayoutPersistenceService(layoutRepository, failingMapper);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> failingService.saveAsJson(new SetupBuildDTO()));
        assertEquals("Failed to serialize layout payload to JSON", ex.getMessage());
    }
}
