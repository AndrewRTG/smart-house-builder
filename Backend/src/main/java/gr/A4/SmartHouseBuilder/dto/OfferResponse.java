package gr.A4.SmartHouseBuilder.dto;

import java.time.LocalDateTime;

public record OfferResponse(
        String storeName,
        Double price,
        String productUrl,
        LocalDateTime scrapedAt
) {}