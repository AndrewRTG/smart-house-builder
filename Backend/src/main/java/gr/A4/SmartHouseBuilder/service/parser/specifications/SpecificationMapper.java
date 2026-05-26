package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;

public class SpecificationMapper {

    public static Map<String, Object> buildSpecifications(
            Integer categoryId,
            String title,
            String description,
            String sourceStore
    ) {
        if (categoryId == null) {
            return null;
        }

        return switch (categoryId) {
            case 1  -> CameraSpecificationExtractor.extract(title, description, sourceStore);
            case 2  -> ExtensionCordSpecificationExtractor.extract(title, description, sourceStore);
            case 3  -> GamingConsoleSpecificationExtractor.extract(title, description, sourceStore);
            case 4  -> ApplianceSpecificationExtractor.extract(title, description, sourceStore);
            case 5  -> HubSpecificationExtractor.extract(title, description, sourceStore);
            case 7  -> PlugSpecificationExtractor.extract(title, description, sourceStore);
            case 8  -> SensorSpecificationExtractor.extract(title, description, sourceStore);
            case 13 -> BulbSpecificationExtractor.extract(title, description, sourceStore);
            default -> GenericSpecificationExtractor.empty();
        };
    }
}