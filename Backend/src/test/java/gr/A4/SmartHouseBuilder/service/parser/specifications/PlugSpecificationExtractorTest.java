package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PlugSpecificationExtractorTest {

    @Test
    void testExtract_ReturnsBaseMap() {
        assertNotNull(new PlugSpecificationExtractor());

        Map<String, Object> specs = PlugSpecificationExtractor.extract("Priza Smart Aqara", "Priza inteligenta cu monitorizare", "ROVISION");

        assertNotNull(specs);
        assertEquals(4, specs.size());
        assertEquals("-", specs.get("max_current_a"));
        assertEquals("-", specs.get("max_power_w"));
        assertEquals("-", specs.get("has_energy_monitoring"));
        assertEquals("-", specs.get("number_of_sockets"));
    }
}
