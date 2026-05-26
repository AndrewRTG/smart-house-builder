package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class MonitorSpecificationExtractorTest {

    @Test
    void testExtract_ValidMonitorSpecs() {
        String title = "Monitor Gaming 27 inch";
        String desc = "Ecran IPS, rezolutie QHD 1440p, refresh 144Hz, timp raspuns 1ms";

        Map<String, Object> specs = MonitorSpecificationExtractor.extract(title, desc, "Store");

        assertTrue((Double) specs.get("width_m") > 0.5);
        assertEquals("IPS", specs.get("display_technology"));
        assertEquals("QHD_2K", specs.get("resolution"));
        assertEquals(144, specs.get("refresh_rate_hz"));
        assertEquals(1.0, specs.get("response_time_ms"));
    }

    @Test
    void testExtract_OLEDAnd4K() {
        String desc = "Tehnologie OLED, claritate 4K, 3840x2160";
        Map<String, Object> specs = MonitorSpecificationExtractor.extract("Monitor Pro", desc, "Store");

        assertEquals("OLED", specs.get("display_technology"));
        assertEquals("UHD_4K", specs.get("resolution"));
    }

    @Test
    void testExtract_DefaultFallback() {
        String desc = "Monitor banal fara detalii";
        Map<String, Object> specs = MonitorSpecificationExtractor.extract("Monitor", desc, "Store");

        assertEquals("IPS", specs.get("display_technology"));
        assertEquals("OTHER", specs.get("resolution"));
        assertEquals(0.31, specs.get("length_m"));
        assertEquals(0.51, specs.get("width_m"));
    }

    @Test
    void testExtract_RefreshAndResponseTimeLimits() {
        String desc = "Refresh 300hz, raspuns 0.5ms";
        Map<String, Object> specs = MonitorSpecificationExtractor.extract("Monitor", desc, "Store");

        assertEquals(300, specs.get("refresh_rate_hz"));
        assertEquals(0.5, specs.get("response_time_ms"));
    }
}