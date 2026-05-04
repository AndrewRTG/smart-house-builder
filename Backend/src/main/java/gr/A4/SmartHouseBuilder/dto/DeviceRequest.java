package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record DeviceRequest(

        @NotNull(message = "ID-ul categoriei este obligatoriu!")
        Integer categoryId,

        @NotBlank(message = "Numele dispozitivului nu poate fi gol!")
        @Size(min = 2, max = 100, message = "Numele trebuie sa aibe intre 2 si 100 de caractere.")
        String name,
        String brand,
        @NotBlank(message = "Descrierea este obligatorie pentru a ajuta utilizatorul.")
        String description,
        String imageUrl,
        String communicationProtocol,
        Map<String,Object> specifications
) {
}
