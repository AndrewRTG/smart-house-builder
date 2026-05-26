package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SpecificationMapperTest {

    @Test
    void testBuildSpecifications_NullCategoryId() {
        assertNull(SpecificationMapper.buildSpecifications(null, "Title", "Desc", "Store"));
    }

    @Test
    void testBuildSpecifications_AllCategories() {
        for (int i = 1; i <= 13; i++) {
            Map<String, Object> result = SpecificationMapper.buildSpecifications(i, "Test Title", "Test Desc", "ROVISION");

            assertNotNull(result, "Extractorul ar trebui să returneze un Map pentru categoria " + i);
        }
    }

    @Test
    void testBuildSpecifications_DefaultCase() {
        Map<String, Object> result = SpecificationMapper.buildSpecifications(99, "Unknown", "Desc", "Store");

        assertNotNull(result, "Ramura default trebuie să returneze un Map (probabil gol)");
        assertTrue(result.isEmpty(), "Ramura default ar trebui să returneze un map gol conform GenericSpecificationExtractor");
    }
}