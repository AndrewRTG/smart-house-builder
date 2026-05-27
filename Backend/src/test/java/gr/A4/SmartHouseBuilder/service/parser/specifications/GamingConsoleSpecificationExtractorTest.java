package gr.A4.SmartHouseBuilder.service.parser.specifications;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class GamingConsoleSpecificationExtractorTest {

    @Test
    void testExtract_WithTeraBytes_4K_AndBluRay() {
        String title = "Sony PlayStation 5";
        String description = "Storage 1.5 tb, amazing 4k gaming, built-in blu-ray player.";
        Map<String, Object> result = GamingConsoleSpecificationExtractor.extract(title, description, "CASESMART");
        assertNotNull(result, "Result map should not be null");
        assertEquals(1500, result.get("storage_capacity_gb"), "1.5 TB should be converted to 1500 GB");
        assertEquals("4K", result.get("max_resolution_output"), "Resolution should be uppercase 4K");
        assertEquals(true, result.get("has_disc_drive"), "Blu-ray keyword should set disc drive to true");
    }

    @Test
    void testExtract_WithGigaBytes_1080p_AndDigitalEdition() {
        String title = "Xbox Series S Digital Edition";
        String description = "512 gb ssd, perfect for 1080p monitors.";
        Map<String, Object> result = GamingConsoleSpecificationExtractor.extract(title, description, "ROVISION");
        assertEquals(512, result.get("storage_capacity_gb"), "Storage should be exactly 512 GB");
        assertEquals("1080P", result.get("max_resolution_output"), "Resolution should be uppercase 1080P");
        assertEquals(false, result.get("has_disc_drive"), "Digital edition keyword should set disc drive to false");
    }
    @Test
    void testExtract_WithCommaDecimal_And8K() {
        String title = "PS5 Pro";
        String description = "Massive 2,0 tb storage, ultimate 8k experience, dvd included";
        Map<String, Object> result = GamingConsoleSpecificationExtractor.extract(title, description, "VONMAG");
        assertEquals(2000, result.get("storage_capacity_gb"), "2,0 TB should be converted to 2000 GB");
        assertEquals("8K", result.get("max_resolution_output"), "Resolution should be uppercase 8K");
        assertEquals(true, result.get("has_disc_drive"), "DVD keyword should set disc drive to true");
    }
    @Test
    void testExtract_WithInvalidOrMissingValues_TriggersFallbacks() {
        String title = "Retro Mini Console";
        String description = "Just a classic console. Nothing special.";
        Map<String, Object> result = GamingConsoleSpecificationExtractor.extract(title, description, "ROVISION");
        assertEquals(500, result.get("storage_capacity_gb"), "Should fallback to DEFAULT_STORAGE (500)");
        assertEquals("UNKNOWN", result.get("max_resolution_output"), "Should fallback to DEFAULT_RESOLUTION (UNKNOWN)");
        assertEquals(false, result.get("has_disc_drive"), "Should default to false when no disc keyword is found");
    }
    @Test
    void testExtract_WithZeroStorage_TriggersFallback() {
        String title = "Weird Console";
        String description = "0 gb memory, 1440p resolution";
        Map<String, Object> result = GamingConsoleSpecificationExtractor.extract(title, description, "VONMAG");
        assertEquals(500, result.get("storage_capacity_gb"), "0 GB should trigger the fallback to 500 GB");
        assertEquals("1440P", result.get("max_resolution_output"), "Resolution should be 1440P");
    }
    @Test
    void testConstructor_ForFullCoverage() {
        GamingConsoleSpecificationExtractor extractor = new GamingConsoleSpecificationExtractor();
        assertNotNull(extractor, "Constructor should be invokable for coverage");
    }
    @Test
    void testUnreachableBranches_InPrivateMethods() throws Exception {
        java.lang.reflect.Method stringMethod = GamingConsoleSpecificationExtractor.class
                .getDeclaredMethod("toRequiredString", String.class, String.class);
        stringMethod.setAccessible(true);
        assertEquals("FALLBACK", stringMethod.invoke(null, "   ", "FALLBACK"), "Should trigger isBlank() branch");
        assertEquals("FALLBACK", stringMethod.invoke(null, "-", "FALLBACK"), "Should trigger equals('-') branch");
        java.lang.reflect.Method intMethod = GamingConsoleSpecificationExtractor.class
                .getDeclaredMethod("toRequiredInteger", Integer.class, Integer.class);
        intMethod.setAccessible(true); // Îi tăiem lacătul
        assertEquals(500, intMethod.invoke(null, 0, 500), "Should trigger value < 1 branch");
    }
}