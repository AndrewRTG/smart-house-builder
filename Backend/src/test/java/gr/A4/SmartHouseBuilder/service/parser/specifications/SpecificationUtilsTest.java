package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import gr.A4.SmartHouseBuilder.service.parser.specifications.SpecificationUtils;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SpecificationUtilsTest {

    @Test
    void testBase_CreatesMapWithHyphens() {
        Map<String, Object> result = SpecificationUtils.base("length", "width");

        assertEquals(2, result.size());
        assertEquals("-", result.get("length"));
        assertEquals("-", result.get("width"));
    }

    @Test
    void testPutIfFound_OnlyPutsNonNullValues() {
        Map<String, Object> map = new HashMap<>();

        SpecificationUtils.putIfFound(map, "valid_key", "value1");
        SpecificationUtils.putIfFound(map, "null_key", null);

        assertEquals(1, map.size());
        assertEquals("value1", map.get("valid_key"));
        assertNull(map.get("null_key"));
    }

    @Test
    void testContainsAny_MatchesKeywordsCorrectly() {
        String text = "Acesta este un Smart TV 4K cu ecran OLED";

        assertTrue(SpecificationUtils.containsAny(text, "4k", "led"));
        assertTrue(SpecificationUtils.containsAny(text, "oled"));
        assertFalse(SpecificationUtils.containsAny(text, "qled", "ips"));
        assertFalse(SpecificationUtils.containsAny(null, "4k"));
    }

    @Test
    void testParseNumberFlexible_HandlesDifferentFormats() {
        assertEquals(1500, SpecificationUtils.parseNumberFlexible("1.500"));
        assertEquals(1500, SpecificationUtils.parseNumberFlexible("1,500"));

        assertEquals(15.5, SpecificationUtils.parseNumberFlexible("15.5"));
        assertEquals(15.5, SpecificationUtils.parseNumberFlexible("15,5"));

        assertEquals(10, SpecificationUtils.parseNumberFlexible("10.0"));

        assertNull(SpecificationUtils.parseNumberFlexible(null));
        assertNull(SpecificationUtils.parseNumberFlexible("text invalid care da exceptie"));
    }

    @Test
    void testNormalizeNumber_ReturnsIntIfWhole() {
        assertEquals(10, SpecificationUtils.normalizeNumber(10.0));
        assertEquals(10.5, SpecificationUtils.normalizeNumber(10.5));
    }

    @Test
    void testSurroundingText_RespectsBounds() {
        String text = "1234567890";
        assertEquals("12345", SpecificationUtils.surroundingText(text, 2, 3, 2));

        assertEquals("123", SpecificationUtils.surroundingText(text, 0, 1, 2));
        assertEquals("7890", SpecificationUtils.surroundingText(text, 8, 9, 2));
    }

    @Test
    void testNormalize_CleansTextCorrectly() {
        assertEquals("", SpecificationUtils.normalize(null));

        String dirtyText = "  Acesta  <br> &nbsp; este&amp;un text&gt;&lt; cu diacritice: ăâîșşțţ și grade 45°!!!  ";
        String expected = "acesta este&un text>< cu diacritice: aaisstt si grade 45 !!!";

        assertEquals(expected, SpecificationUtils.normalize(dirtyText));
    }
}