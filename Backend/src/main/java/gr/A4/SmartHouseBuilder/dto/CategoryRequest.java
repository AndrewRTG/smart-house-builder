package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(

        @NotBlank(message = "Numele categoriei nu poate fi gol!")
        @Size(min = 2, max = 50, message = "Numele categoriei trebuie sa aiba intre 2 si 50 de caractere.")
        String name,
        @NotBlank(message = "Descrierea categoriei este obligatorie.")
        String description
) {
}
