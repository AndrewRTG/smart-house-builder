package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ApplianceSpecificationExtractorTest {

    @Test
    void testExtract_ApplianceTypes() {
        assertEquals("AIR_CONDITIONER", ApplianceSpecificationExtractor.extract("aer conditionat", "", "").get("appliance_type"));
        assertEquals("ELECTRIC_HEATER", ApplianceSpecificationExtractor.extract("radiator", "", "").get("appliance_type"));
        assertEquals("WASHING_MACHINE", ApplianceSpecificationExtractor.extract("masina de spalat rufe", "", "").get("appliance_type"));
        assertEquals("DISHWASHER", ApplianceSpecificationExtractor.extract("masina de spalat vase", "", "").get("appliance_type"));
        assertEquals("ELECTRIC_OVEN", ApplianceSpecificationExtractor.extract("cuptor", "", "").get("appliance_type"));
        assertEquals("REFRIGERATOR", ApplianceSpecificationExtractor.extract("frigider", "", "").get("appliance_type"));
        assertEquals("FREEZER", ApplianceSpecificationExtractor.extract("congelator", "", "").get("appliance_type"));
        assertEquals("COFFEE_MAKER", ApplianceSpecificationExtractor.extract("espressor", "", "").get("appliance_type"));
        assertEquals("MICROWAVE", ApplianceSpecificationExtractor.extract("microunde", "", "").get("appliance_type"));
        assertEquals("TOASTER", ApplianceSpecificationExtractor.extract("toaster", "", "").get("appliance_type"));
    }

    @Test
    void testExtract_EnergyClasses() {
        assertEquals("A", ApplianceSpecificationExtractor.extract("clasa a", "", "").get("energy_class"));
        assertEquals("B_PLUS", ApplianceSpecificationExtractor.extract("clasa energetica b+x", "", "").get("energy_class"));
        assertEquals("C_PLUS_PLUS", ApplianceSpecificationExtractor.extract("clasa c++x", "", "").get("energy_class"));
        assertEquals("D_PLUS_PLUS_PLUS", ApplianceSpecificationExtractor.extract("clasa energetica d+++x", "", "").get("energy_class"));
    }

    @Test
    void testExtract_PowerConsumption_And_Bounds() {
        Map<String, Object> result = ApplianceSpecificationExtractor.extract("cuptor", "6000 w. 000 w. 2500 w.", "TEST");
        assertEquals(2500, result.get("power_consumption_w"));
    }

    @Test
    void testExtract_Fallbacks() {
        Map<String, Object> result = ApplianceSpecificationExtractor.extract("televizor", "fara detalii", "TEST");

        assertEquals("UNKNOWN", result.get("appliance_type"));
        assertEquals("UNKNOWN", result.get("energy_class"));
        assertEquals("-", result.get("power_consumption_w"));
    }

    @Test
    void testUnreachableBranches_WithMockedStatic() {
        try (MockedStatic<SpecificationUtils> mockedUtils = Mockito.mockStatic(SpecificationUtils.class, Mockito.CALLS_REAL_METHODS)) {
            mockedUtils.when(() -> SpecificationUtils.parseNumberFlexible(Mockito.anyString()))
                    .thenReturn("NOT_A_NUMBER");

            Map<String, Object> result = ApplianceSpecificationExtractor.extract("cuptor", "1500 w.", "TEST");

            assertEquals("-", result.get("power_consumption_w"));
        }
    }

    @Test
    void testUnreachableBranches_InPrivateMethods() throws Exception {
        Method stringMethod = ApplianceSpecificationExtractor.class.getDeclaredMethod("toRequiredString", String.class, String.class);
        stringMethod.setAccessible(true);
        assertEquals("FALLBACK", stringMethod.invoke(null, "   ", "FALLBACK"));
        assertEquals("FALLBACK", stringMethod.invoke(null, "-", "FALLBACK"));
    }

    @Test
    void testConstructor_ForFullCoverage() {
        ApplianceSpecificationExtractor extractor = new ApplianceSpecificationExtractor();
        assertNotNull(extractor);
    }
}