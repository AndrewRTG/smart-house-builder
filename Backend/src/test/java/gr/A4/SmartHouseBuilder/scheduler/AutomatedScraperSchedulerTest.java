package gr.A4.SmartHouseBuilder.scheduler;

import gr.A4.SmartHouseBuilder.service.DeviceImportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.InputStream;
import java.net.URL;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomatedScraperSchedulerTest {

    @Mock
    private DeviceImportService deviceImportService;

    @InjectMocks
    private AutomatedScraperScheduler automatedScraperScheduler;

    @Test
    void testRunAutomatedScrapers_Success_And_FullCoverage() throws Exception {
        java.io.File tempFile = java.io.File.createTempFile("dummy-test-file", ".xml");
        tempFile.deleteOnExit();
        String guaranteedValidUrl = tempFile.toURI().toURL().toString();
        ReflectionTestUtils.setField(automatedScraperScheduler, "rovisionUrl", guaranteedValidUrl);
        ReflectionTestUtils.setField(automatedScraperScheduler, "caseSmartUrl", guaranteedValidUrl);
        ReflectionTestUtils.setField(automatedScraperScheduler, "vonMagUrl", guaranteedValidUrl);
        automatedScraperScheduler.runAutomatedScrapers();
        verify(deviceImportService, times(1)).importDevicesFromXml(eq("ROVISION"), any(InputStream.class));
        verify(deviceImportService, times(1)).importDevicesFromXml(eq("CASESMART"), any(InputStream.class));
        verify(deviceImportService, times(1)).importDevicesFromXml(eq("VONMAG"), any(InputStream.class));
    }

    @Test
    void testRunAutomatedScrapers_WithException_ForCatchBlockCoverage() {
        ReflectionTestUtils.setField(automatedScraperScheduler, "rovisionUrl", "invalid-url-string");
        ReflectionTestUtils.setField(automatedScraperScheduler, "caseSmartUrl", "invalid-url-string");
        ReflectionTestUtils.setField(automatedScraperScheduler, "vonMagUrl", "invalid-url-string");

        automatedScraperScheduler.runAutomatedScrapers();

        verify(deviceImportService, never()).importDevicesFromXml(any(), any());
    }
}