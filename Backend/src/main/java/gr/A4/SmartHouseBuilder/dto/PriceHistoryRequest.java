package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record PriceHistoryRequest(

        @NotNull(message = "ID-ul dispozitivului este obligatoriu!")
        Integer deviceId,

        @NotBlank(message = "Numele magazinului nu poate fi gol!")
        String storeName,

        @NotNull(message = "Pretul trebuie sa fie obligatoriu!")
        @Positive(message = "Pretul nu are cum sa fie negativ(am vrea noi)!")
        Double price,

        @NotBlank(message = "URL-ul este obligatoriu!")
        String productUrl,

        @NotNull(message = "Data preluarii pretului este obligatorie!")
        @PastOrPresent(message = "Date preluarii nu poate fi din viitor, sau daca a aparut masina timpului...")
        LocalDateTime scrapedAt
) {
}
