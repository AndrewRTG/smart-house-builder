package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HubSpecificationExtractorTest {

    @Test
    void testExtract_ReturnsCorrectBaseSpecifications() {
        String dummyTitle = "Smart Hub PRO";
        String dummyDescription = "This is a great hub.";
        String dummyStore = "ROVISION";

        Map<String, Object> result = HubSpecificationExtractor.extract(dummyTitle, dummyDescription, dummyStore);

        assertNotNull(result, "The result should not be null.");
        assertTrue(result.containsKey("max_supported_devices"), "Missing key: max_supported_devices");
        assertTrue(result.containsKey("has_ethernet_port"), "Missing key: has_ethernet_port");
        assertTrue(result.containsKey("built_in_siren"), "Missing key: built_in_siren");
    }

    @Test
    void testConstructor_ForFullCoverage() {
        HubSpecificationExtractor extractor = new HubSpecificationExtractor();
        assertNotNull(extractor);
    }
}