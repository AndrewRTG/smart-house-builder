package gr.A4.SmartHouseBuilder.dto;

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
