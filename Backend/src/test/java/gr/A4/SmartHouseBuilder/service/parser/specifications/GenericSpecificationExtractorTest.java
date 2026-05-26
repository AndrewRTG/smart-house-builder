package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GenericSpecificationExtractorTest {

    @Test
    void testEmpty_ReturnsEmptyMap() {
        Map<String, Object> result = GenericSpecificationExtractor.empty();
        assertNotNull(result, "The result should not be null.");
        assertTrue(result.isEmpty(), "The map should be perfectly empty.");
        assertInstanceOf(LinkedHashMap.class, result, "The map should be an instance of LinkedHashMap.");
    }
    @Test
    void testConstructor_ForFullCoverage() {
        GenericSpecificationExtractor extractor = new GenericSpecificationExtractor();
        assertNotNull(extractor);
    }
}