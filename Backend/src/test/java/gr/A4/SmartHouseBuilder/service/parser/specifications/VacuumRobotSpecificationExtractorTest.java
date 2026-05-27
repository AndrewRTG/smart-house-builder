package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VacuumRobotSpecificationExtractorTest {

    @Test
    void testExtract_FullValidSpecs_LidarAndMopping() {
        String title = "Roborock S7";
        String desc = "Aspirator robot cu navigatie laser, putere aspirare 5000 Pa, baterie 5200 mAh, capacitate rezervor 400 ml si functie mop.";

        Map<String, Object> specs = VacuumRobotSpecificationExtractor.extract(title, desc, "Store");

        assertEquals(5000, specs.get("suction_power_pa"));
        assertEquals(5200, specs.get("battery_capacity_mah"));
        assertEquals(true, specs.get("has_mopping_function"));
        assertEquals("LIDAR", specs.get("navigation_type"));
        assertEquals(400, specs.get("dustbin_capacity_ml"));
    }

    @Test
    void testExtract_AlternateKeywords_VslamAndVacuumOnly() {
        String desc = "Camera navigation, suction power: 2500pa, doar aspirare, dust bin 250ml, 1500mah";
        Map<String, Object> specs = VacuumRobotSpecificationExtractor.extract("Roomba", desc, "Store");

        assertEquals(2500, specs.get("suction_power_pa"));
        assertEquals(1500, specs.get("battery_capacity_mah"));
        assertEquals(false, specs.get("has_mopping_function"));
        assertEquals("CAMERA_VSLAM", specs.get("navigation_type"));
        assertEquals(250, specs.get("dustbin_capacity_ml"));
    }

    @Test
    void testExtract_GyroscopeAndEmptyValues_AppliesDefaults() {
        String desc = "Aspirator ieftin cu giroscop, fara specificatii tehnice clare.";
        Map<String, Object> specs = VacuumRobotSpecificationExtractor.extract("Generic", desc, "Store");

        assertEquals(1000, specs.get("suction_power_pa"));
        assertEquals(300, specs.get("dustbin_capacity_ml"));
        assertEquals(false, specs.get("has_mopping_function"));
        assertNull(specs.get("battery_capacity_mah"));
        assertEquals("GYROSCOPE", specs.get("navigation_type"));
    }

    @Test
    void testExtract_RandomNavAndOutOfBoundsValues_Ignored() {
        String desc = "Bump and go, putere 10 Pa, baterie 90000 mAh, dustbin 10 ml";
        Map<String, Object> specs = VacuumRobotSpecificationExtractor.extract("Generic", desc, "Store");

        assertEquals("RANDOM", specs.get("navigation_type"));

        assertEquals(1000, specs.get("suction_power_pa"));

        assertNull(specs.get("battery_capacity_mah"));

        assertEquals(300, specs.get("dustbin_capacity_ml"));
    }
}