package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.DeviceImportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ImportControllerTest {

    @Mock
    private DeviceImportService importService;

    @Test
    void importsDevicesFromFeedUrl() throws Exception {
        ImportController controller = new ImportController(importService);
        Path feed = Files.createTempFile("devices", ".xml");
        Files.writeString(feed, "<devices />");

        ResponseEntity<String> response = controller.importFromUrl("ROVISION", feed.toUri().toURL().toString());

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).contains("Import finalizat cu succes");
        verify(importService).importDevicesFromXml(eq("ROVISION"), any(InputStream.class));
    }

    @Test
    void returnsServerErrorForInvalidFeedUrl() {
        ImportController controller = new ImportController(importService);

        ResponseEntity<String> response = controller.importFromUrl("ROVISION", "bad://feed");

        assertThat(response.getStatusCode().is5xxServerError()).isTrue();
        assertThat(response.getBody()).contains("A ap");
        verify(importService, never()).importDevicesFromXml(any(), any());
    }
}
