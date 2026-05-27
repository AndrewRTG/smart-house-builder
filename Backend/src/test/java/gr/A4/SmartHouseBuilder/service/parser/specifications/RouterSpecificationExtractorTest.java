package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RouterSpecificationExtractorTest {

    @Test
    void testExtract_RouterWithMeshAndHighSpeed() {
        String title = "Router Wi-Fi 6 Mesh";
        String desc = "Viteza AX3000, 4 porturi LAN, suporta Mesh EasyMesh";

        Map<String, Object> specs = RouterSpecificationExtractor.extract(title, desc, "Store");

        assertEquals(3000, specs.get("max_speed_mbps"));
        assertEquals(4, specs.get("number_of_lan_ports"));
        assertEquals(true, specs.get("has_mesh_support"));

        List<String> bands = (List<String>) specs.get("frequency_bands");
        assertTrue(bands.contains("BAND_5_GHZ"));
        assertTrue(bands.contains("BAND_2_4_GHZ"));
    }

    @Test
    void testExtract_SpeedParsingVariations() {
        String desc1 = "Router 1200 Mbps + 500 Mbps";
        Map<String, Object> specs1 = RouterSpecificationExtractor.extract("R1", desc1, "Store");
        assertEquals(1700, specs1.get("max_speed_mbps"));

        String desc2 = "Router 2.5 Gbps";
        Map<String, Object> specs2 = RouterSpecificationExtractor.extract("R2", desc2, "Store");
        assertEquals(2500, specs2.get("max_speed_mbps"));
    }

    @Test
    void testExtract_FrequencyBandsLogic() {
        String desc = "Suporta 6GHz, 5GHz si 2.4GHz";
        Map<String, Object> specs = RouterSpecificationExtractor.extract("R3", desc, "Store");

        List<String> bands = (List<String>) specs.get("frequency_bands");
        assertTrue(bands.contains("BAND_6_GHZ"));
        assertTrue(bands.contains("BAND_5_GHZ"));
        assertTrue(bands.contains("BAND_2_4_GHZ"));
    }

    @Test
    void testExtract_DefaultValues() {
        String desc = "Router simplu fara detalii";
        Map<String, Object> specs = RouterSpecificationExtractor.extract("R4", desc, "Store");

        assertEquals(300, specs.get("max_speed_mbps"));
        List<String> bands = (List<String>) specs.get("frequency_bands");
        assertEquals(1, bands.size());
        assertEquals("BAND_2_4_GHZ", bands.get(0));
    }
}