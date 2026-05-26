package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;

public class SensorSpecificationExtractor {

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        return SpecificationUtils.base(
                "sensor_target",
                "battery_type",
                "operating_temperature_c",
                "detection_range_m"
        );
    }
}