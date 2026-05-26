package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ExtensionCordSpecificationExtractorTest {

    @Test
    void testExtract_AllValidValues() {
        String title = "Smart Extension Cord";
        String description = "Are 5 prize, 2x usb, suporta 2500 w, 10 amperi, lungime 2.5 metri. Are monitorizare consum inclusa.";

        Map<String, Object> result = ExtensionCordSpecificationExtractor.extract(title, description, "ROVISION");

        assertNotNull(result);
        assertEquals(5, result.get("number_of_sockets"));
        assertEquals(2, result.get("number_of_usb_ports"));
        assertEquals(2500, result.get("max_power_w"));
        assertEquals(10, result.get("max_current_a"));
        assertEquals(2.5, result.get("cable_length_m"));
        assertEquals(true, result.get("has_energy_monitoring"));
    }

    @Test
    void testExtract_NoValues_TriggersFallbacks() {
        String title = "Cablu prelungitor simplu";
        String description = "Doar un cablu alb.";

        Map<String, Object> result = ExtensionCordSpecificationExtractor.extract(title, description, "VONMAG");

        assertEquals(3, result.get("number_of_sockets"));
        assertEquals("-", result.get("number_of_usb_ports"));
        assertEquals(3680, result.get("max_power_w"));
        assertEquals(16, result.get("max_current_a"));
        assertEquals(1.5, result.get("cable_length_m"));
        assertEquals(false, result.get("has_energy_monitoring"));
    }

    @Test
    void testExtract_OutOfBoundsValues_AreIgnored() {
        String title = "Gigant si Minuscul";
        String description = "0 prize, 50 prize, 0 usb, 15 usb, 000 w, 9000 w, 0 amperi, 64 amperi, 0.0 m, 100 m.";

        Map<String, Object> result = ExtensionCordSpecificationExtractor.extract(title, description, "CASESMART");

        assertEquals(3, result.get("number_of_sockets"));
        assertEquals("-", result.get("number_of_usb_ports"));
        assertEquals(3680, result.get("max_power_w"));
        assertEquals(16, result.get("max_current_a"));
        assertEquals(1.5, result.get("cable_length_m"));
    }

    @Test
    void testExtract_TriggersCatchBlocks_AndThenSucceeds() {
        String title = "Error Test";
        String description = "999999999999999 prize, 5 prize. 999999999999999 usb. 999999999999999 a, 10 a.";

        Map<String, Object> result = ExtensionCordSpecificationExtractor.extract(title, description, "ROVISION");

        assertEquals(5, result.get("number_of_sockets"));
        assertEquals("-", result.get("number_of_usb_ports"));
        assertEquals(10, result.get("max_current_a"));
    }

    @Test
    void testExtract_MultipleMatches_SecondIsValid() {
        String title = "Multi Test";
        String description = "50 prize, 5 prize. 000 w, 2500 w. 64 a, 10 a. 100 m, 2.5 m.";

        Map<String, Object> result = ExtensionCordSpecificationExtractor.extract(title, description, "TEST");

        assertEquals(5, result.get("number_of_sockets"));
        assertEquals(2500, result.get("max_power_w"));
        assertEquals(10, result.get("max_current_a"));
        assertEquals(2.5, result.get("cable_length_m"));
    }

    @Test
    void testImpossibleBranches_WithMockedStatic() {
        try (MockedStatic<SpecificationUtils> mockedUtils = Mockito.mockStatic(SpecificationUtils.class, Mockito.CALLS_REAL_METHODS)) {
            mockedUtils.when(() -> SpecificationUtils.parseNumberFlexible(Mockito.anyString()))
                    .thenReturn("I_AM_NOT_A_NUMBER", 2000, "I_AM_NOT_A_NUMBER", 2.0);

            Map<String, Object> result = ExtensionCordSpecificationExtractor.extract(
                    "Test",
                    "1000 w, 2000 w. 10.0 m, 2.0 m.",
                    "TEST"
            );

            assertEquals(2000, result.get("max_power_w"));
            assertEquals(2.0, result.get("cable_length_m"));
        }
    }

    @Test
    void testUnreachableBranches_InPrivateMethods() throws Exception {
        java.lang.reflect.Method intMethod = ExtensionCordSpecificationExtractor.class
                .getDeclaredMethod("toRequiredInteger", Integer.class, Integer.class);
        intMethod.setAccessible(true);
        assertEquals(99, intMethod.invoke(null, 0, 99));

        java.lang.reflect.Method doubleMethod = ExtensionCordSpecificationExtractor.class
                .getDeclaredMethod("toRequiredDouble", Double.class, Double.class);
        doubleMethod.setAccessible(true);
        assertEquals(99.0, doubleMethod.invoke(null, 0.0, 99.0));
    }

    @Test
    void testConstructor_ForFullCoverage() {
        ExtensionCordSpecificationExtractor extractor = new ExtensionCordSpecificationExtractor();
        assertNotNull(extractor);
    }
}