package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CameraSpecificationExtractorTest {

    @Test
    void testExtract_AllValidValues_Pattern1() {
        String title = "Camera 4K";
        String description = "unghi de vizualizare 120 grade. Are night vision. zoom optic de 10 x. zoom digital de 5 x. stocare pe microsd. alimentare prin poe.";
        Map<String, Object> result = CameraSpecificationExtractor.extract(title, description, "ROVISION");

        assertEquals("4K", result.get("resolution"));
        assertEquals(120, result.get("field_of_view_degreed"));
        assertEquals(true, result.get("has_night_vision"));
        assertEquals(10, result.get("optical_zoom_x"));
        assertEquals(5, result.get("digital_zoom_x"));
        assertEquals("MicroSD", result.get("storage_type"));
        assertEquals("PoE", result.get("power_source"));
    }

    @Test
    void testExtract_AllValidValues_Pattern2() {
        String title = "Camera 1080p";
        String description = "camp fov 90 deg. 12 x zoom optic. 4x zoom digital. Inregistrare cloud. functioneaza pe baterie wireless.";
        Map<String, Object> result = CameraSpecificationExtractor.extract(title, description, "CASESMART");

        assertEquals("1080P", result.get("resolution"));
        assertEquals(90, result.get("field_of_view_degreed"));
        assertEquals(false, result.get("has_night_vision"));
        assertEquals(12, result.get("optical_zoom_x"));
        assertEquals(4, result.get("digital_zoom_x"));
        assertEquals("Cloud", result.get("storage_type"));
        assertEquals("Baterie/Acumulator", result.get("power_source"));
    }

    @Test
    void testExtract_AlternativeBranches() {
        String title1 = "Camera 2K";
        String description1 = "suporta nvr. panou solar inclus. infrarosu.";
        Map<String, Object> result1 = CameraSpecificationExtractor.extract(title1, description1, "VONMAG");

        assertEquals("2K", result1.get("resolution"));
        assertEquals("NVR/DVR", result1.get("storage_type"));
        assertEquals("Solar", result1.get("power_source"));
        assertEquals(true, result1.get("has_night_vision"));

        String title2 = "720p";
        String description2 = "hdd intern, conectare la priza 220v. smart ir.";
        Map<String, Object> result2 = CameraSpecificationExtractor.extract(title2, description2, "TEST");

        assertEquals("720P", result2.get("resolution"));
        assertEquals("HDD", result2.get("storage_type"));
        assertEquals("Retea electrica", result2.get("power_source"));
        assertEquals(true, result2.get("has_night_vision"));
    }

    @Test
    void testExtract_FovLoopsAndOutOfBounds() {
        String title = "Test FOV Loop";
        String description = "Aici avem o temperatura normala de 100 grade. " +
                "Dupa foarte mult text irelevant, intalnim o rotatie de 400 grade. " +
                "Mai tarziu in descriere, analizam un camp nul de 000 grade. " +
                "In sfarsit, unghi de vizualizare 150 grade.";

        Map<String, Object> result = CameraSpecificationExtractor.extract(title, description, "TEST");
        assertEquals(150, result.get("field_of_view_degreed"));
    }

    @Test
    void testExtract_NoValues_TriggersFallbacks() {
        String title = "Camera simpla";
        String description = "Fara detalii extra.";
        Map<String, Object> result = CameraSpecificationExtractor.extract(title, description, "VONMAG");

        assertEquals("UNKNOWN", result.get("resolution"));
        assertEquals("N/A", result.get("storage_type"));
        assertEquals(false, result.get("has_night_vision"));
        assertEquals("-", result.get("field_of_view_degreed"));
        assertEquals("-", result.get("optical_zoom_x"));
        assertEquals("-", result.get("digital_zoom_x"));
        assertEquals("-", result.get("power_source"));
    }

    @Test
    void testExtract_TriggersCatchBlocks() {
        String title = "Error Test";
        String description = "unghi de vizualizare de 999999999999999 grade. zoom optic de 999999999999999 x. 999999999999999 x zoom digital.";

        Map<String, Object> result = CameraSpecificationExtractor.extract(title, description, "ROVISION");

        assertEquals("-", result.get("field_of_view_degreed"));
        assertEquals(-1, result.get("optical_zoom_x"));
        assertEquals(-1, result.get("digital_zoom_x"));
    }

    @Test
    void testUnreachableBranches_InPrivateMethods() throws Exception {
        Method stringMethod = CameraSpecificationExtractor.class.getDeclaredMethod("toRequiredString", String.class, String.class);
        stringMethod.setAccessible(true);
        assertEquals("FALLBACK", stringMethod.invoke(null, "   ", "FALLBACK"));
        assertEquals("FALLBACK", stringMethod.invoke(null, "-", "FALLBACK"));

        Method parseIntMethod = CameraSpecificationExtractor.class.getDeclaredMethod("parseIntSafe", String.class);
        parseIntMethod.setAccessible(true);
        assertEquals(-1, parseIntMethod.invoke(null, "NOT_A_NUMBER"));
    }

    @Test
    void testConstructor_ForFullCoverage() {
        CameraSpecificationExtractor extractor = new CameraSpecificationExtractor();
        assertNotNull(extractor);
    }
}