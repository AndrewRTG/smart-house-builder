package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BulbSpecificationExtractorTest {

    private void assertNumberEquals(Object expected, Object actual) {
        assertNotNull(actual);
        assertTrue(actual instanceof Number);
        assertEquals(((Number) expected).doubleValue(), ((Number) actual).doubleValue(), 0.001);
    }

    @Test
    void testExtract_StandardBulb_ValidValues() {
        String title = "Smart LED Bulb";
        String description = "putere 15 w, brightness 800 lm, socket E27, color temp 2700K-3000K, multi color.";
        Map<String, Object> result = BulbSpecificationExtractor.extract(title, description, "ROVISION");

        assertNumberEquals(15.0, result.get("power_w"));
        assertNumberEquals(800, result.get("brightness_lumens"));
        assertEquals("E27", result.get("socket_type"));
        assertEquals("2700-3000", result.get("color_temperature_k"));
        assertEquals(true, result.get("is_rgb"));
    }

    @Test
    void testExtract_PanelVsStrip_Limits() {
        Map<String, Object> result = BulbSpecificationExtractor.extract("lampa", "putere 250 w, 5 metri", "TEST");
        assertNumberEquals(250.0, result.get("power_w"));
        assertEquals("-", result.get("length_m"));
    }

    @Test
    void testExtract_ExcludeEquivalentPower_And_ContextualInvalid() {
        String padding = " text ".repeat(20);
        String description = "consum 0 w. equivalent 60 w. " + padding + " real 10 w.";
        Map<String, Object> result = BulbSpecificationExtractor.extract("Bulb", description, "TEST");

        assertNumberEquals(10.0, result.get("power_w"));
    }

    @Test
    void testExtract_PowerW_ContextualFallback_And_UpperLimits() {
        Map<String, Object> r1 = BulbSpecificationExtractor.extract("Bulb", "putere 50 w. 15 w.", "TEST");
        assertNumberEquals(15.0, r1.get("power_w"));

        Map<String, Object> r2 = BulbSpecificationExtractor.extract("Banda led", "putere 350 w. 200 w.", "TEST");
        assertNumberEquals(200.0, r2.get("power_w"));

        Map<String, Object> r3 = BulbSpecificationExtractor.extract("Banda led", "putere 500 w. 400 w.", "TEST");
        assertNumberEquals(1.0, r3.get("power_w"));
    }

    @Test
    void testExtract_KelvinPatterns_And_Bounds() {
        assertEquals("3000-4000", BulbSpecificationExtractor.extract("Bulb", "3000 k 4000 k.", "TEST").get("color_temperature_k"));
        assertEquals("5000", BulbSpecificationExtractor.extract("Bulb", "5000 k.", "TEST").get("color_temperature_k"));
        assertEquals("2000-3000", BulbSpecificationExtractor.extract("Bulb", "2000-3000", "TEST").get("color_temperature_k"));

        assertEquals("-", BulbSpecificationExtractor.extract("Bulb", "900-3000", "TEST").get("color_temperature_k"));
        assertEquals("-", BulbSpecificationExtractor.extract("Bulb", "4000-3000", "TEST").get("color_temperature_k"));

        assertEquals("4000", BulbSpecificationExtractor.extract("Bulb", "900 k 4000 k.", "TEST").get("color_temperature_k"));
        assertEquals("4000", BulbSpecificationExtractor.extract("Bulb", "4000 k 3000 k.", "TEST").get("color_temperature_k"));

        assertEquals("-", BulbSpecificationExtractor.extract("Bulb", "999 k.", "TEST").get("color_temperature_k"));
    }

    @Test
    void testExtract_Length_MultiplePattern() {
        String title = "LED Strip";
        String description = "Banda led 2 x 5 metri, putere 250 w, warm white.";
        Map<String, Object> result = BulbSpecificationExtractor.extract(title, description, "TEST");

        assertNumberEquals(10.0, result.get("length_m"));
        assertNumberEquals(250.0, result.get("power_w"));
        assertEquals(false, result.get("is_rgb"));
    }

    @Test
    void testExtract_Length_MetersWordPattern() {
        String title = "Banda led";
        String description = "6 metri.";
        Map<String, Object> result = BulbSpecificationExtractor.extract(title, description, "TEST");

        assertNumberEquals(6.0, result.get("length_m"));
    }

    @Test
    void testExtract_Length_ParenthesisPattern() {
        String title = "Banda led";
        String description = "(3 m).";
        Map<String, Object> result = BulbSpecificationExtractor.extract(title, description, "TEST");

        assertNumberEquals(3.0, result.get("length_m"));
    }

    @Test
    void testExtract_Length_TapoModelPattern() {
        String title = "Banda led";
        String description = "Model L900-5.";
        Map<String, Object> result = BulbSpecificationExtractor.extract(title, description, "TEST");

        assertNumberEquals(5.0, result.get("length_m"));
    }

    @Test
    void testExtract_Length_StandardPattern_WithIgnore() {
        String padding = " text ".repeat(20);
        String title = "Banda led";
        String description = "distanta 10 m. " + padding + " 7 m.";
        Map<String, Object> result = BulbSpecificationExtractor.extract(title, description, "TEST");

        assertNumberEquals(7.0, result.get("length_m"));
    }

    @Test
    void testExtract_InvalidNumbers_TriggerFallbacks() {
        String description = "putere 0 w, 5 lm.";
        Map<String, Object> result = BulbSpecificationExtractor.extract("Bulb", description, "TEST");

        assertNumberEquals(1.0, result.get("power_w"));
        assertNumberEquals(10, result.get("brightness_lumens"));
    }

    @Test
    void testExtract_AllNulls() {
        Map<String, Object> result = BulbSpecificationExtractor.extract("Bulb", "No details", "TEST");

        assertNumberEquals(1.0, result.get("power_w"));
        assertNumberEquals(10, result.get("brightness_lumens"));
        assertEquals("N/A", result.get("socket_type"));
        assertEquals(false, result.get("is_rgb"));
    }

    @Test
    void testUnreachableBranches_WithMockedStatic() {
        try (MockedStatic<SpecificationUtils> mockedUtils = Mockito.mockStatic(SpecificationUtils.class, Mockito.CALLS_REAL_METHODS)) {
            mockedUtils.when(() -> SpecificationUtils.parseNumberFlexible(Mockito.anyString()))
                    .thenReturn(2, "NOT_A_NUMBER");

            Map<String, Object> result = BulbSpecificationExtractor.extract("Banda led", "putere 10 w, 2 x 5 metri, 800 lm", "TEST");

            assertEquals("NOT_A_NUMBER", result.get("length_m"));
        }
    }

    @Test
    void testUnreachableBranches_InPrivateMethods() throws Exception {
        Method stringMethod = BulbSpecificationExtractor.class.getDeclaredMethod("toRequiredString", String.class, String.class);
        stringMethod.setAccessible(true);
        assertEquals("FALLBACK", stringMethod.invoke(null, "   ", "FALLBACK"));
        assertEquals("FALLBACK", stringMethod.invoke(null, "-", "FALLBACK"));

        Method parseIntMethod = BulbSpecificationExtractor.class.getDeclaredMethod("parseIntSafe", String.class);
        parseIntMethod.setAccessible(true);
        assertEquals(-1, parseIntMethod.invoke(null, "NOT_A_NUMBER"));

        Method isValidKelvinMethod = BulbSpecificationExtractor.class.getDeclaredMethod("isValidKelvin", int.class);
        isValidKelvinMethod.setAccessible(true);
        assertEquals(false, isValidKelvinMethod.invoke(null, 999));
        assertEquals(true, isValidKelvinMethod.invoke(null, 5000));
        assertEquals(false, isValidKelvinMethod.invoke(null, 15000));
    }

    @Test
    void testConstructor_ForFullCoverage() {
        BulbSpecificationExtractor extractor = new BulbSpecificationExtractor();
        assertNotNull(extractor);
    }
}