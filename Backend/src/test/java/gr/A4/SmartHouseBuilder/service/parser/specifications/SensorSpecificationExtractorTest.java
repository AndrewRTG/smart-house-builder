package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SensorSpecificationExtractorTest {

    @Test
    void testExtract_ReturnsBaseMap() {
        Map<String, Object> specs = SensorSpecificationExtractor.extract("Senzor Miscare", "Detecteaza prezenta", "ROVISION");

        assertNotNull(specs);
        assertEquals(4, specs.size());
        assertEquals("-", specs.get("sensor_target"));
        assertEquals("-", specs.get("battery_type"));
        assertEquals("-", specs.get("operating_temperature_c"));
        assertEquals("-", specs.get("detection_range_m"));
    }
}