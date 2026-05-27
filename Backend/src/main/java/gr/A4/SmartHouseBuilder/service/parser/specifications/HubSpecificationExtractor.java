package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;

public class HubSpecificationExtractor {

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        return SpecificationUtils.base(
                "max_supported_devices",
                "has_ethernet_port",
                "built_in_siren"
        );
    }
}