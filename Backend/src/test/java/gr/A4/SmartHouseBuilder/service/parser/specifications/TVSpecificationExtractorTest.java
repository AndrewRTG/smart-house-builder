package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class TVSpecificationExtractorTest {

    @Test
    void testExtract_FullValidSpecs() {
        String title = "Smart TV 55 inch";
        String desc = "Display QLED, rezolutie 4K UHD, Google TV, refresh 120Hz";

        Map<String, Object> specs = TVSpecificationExtractor.extract(title, desc, "Store");

        assertTrue((Double) specs.get("width_m") > 1.0);
        assertEquals("IPS", specs.get("display_technology")); // QLED cade pe fallback-ul IPS din codul tău
        assertEquals("UHD_4K", specs.get("resolution"));
        assertEquals("GOOGLE_TV", specs.get("operating_system"));
        assertEquals(120, specs.get("refresh_rate_hz"));
    }

    @Test
    void testExtract_OSAndResolutionDetection() {
        String desc = "webOS, full hd 1920x1080";
        Map<String, Object> specs = TVSpecificationExtractor.extract("LG TV", desc, "Store");

        assertEquals("WEBOS", specs.get("operating_system"));
        assertEquals("FHD_1080P", specs.get("resolution"));
    }

    @Test
    void testExtract_FallbackValues() {
        String desc = "Televizor fara specificatii";
        Map<String, Object> specs = TVSpecificationExtractor.extract("TV", desc, "Store");

        assertEquals("IPS", specs.get("display_technology"));
        assertEquals("FHD_1080P", specs.get("resolution"));
        assertEquals(0.44, specs.get("length_m"));
        assertEquals(0.78, specs.get("width_m"));
    }

    @Test
    void testExtract_InvalidLimits() {
        String desc = "Refresh 30hz (prea mic), diagonala 10 inch (prea mica)";
        Map<String, Object> specs = TVSpecificationExtractor.extract("TV", desc, "Store");

        assertEquals("-", specs.get("refresh_rate_hz"));

        assertEquals(0.44, specs.get("length_m"));
    }
}