package gr.A4.SmartHouseBuilder.endpoint.dto;

import java.time.LocalDateTime;

public record PriceHistoryResponse(
        Integer id,
        Integer deviceId,
        String storeName,
        Double price,
        String productUrl,
        LocalDateTime scrapedAt
) {
}
