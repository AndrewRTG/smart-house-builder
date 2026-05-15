package gr.A4.SmartHouseBuilder.dto;

import java.util.Map;

public record DeviceResponse(
        Integer id,
        Integer categoryId,
        String categoryName,
        String name,
        String brand,
        String description,
        String imageUrl,
        String communicationProtocol,
        Map<String,Object> specifications,
        Double bestPrice,
        String bestPriceUrl
) {

}
