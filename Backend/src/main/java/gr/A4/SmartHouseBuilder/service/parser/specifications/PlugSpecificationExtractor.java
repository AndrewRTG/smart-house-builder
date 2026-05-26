package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;

public class PlugSpecificationExtractor {

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        return SpecificationUtils.base(
                "max_current_a",
                "max_power_w",
                "has_energy_monitoring",
                "number_of_sockets"
        );
    }
}