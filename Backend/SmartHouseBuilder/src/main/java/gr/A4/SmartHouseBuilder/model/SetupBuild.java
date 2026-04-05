package gr.A4.SmartHouseBuilder.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class SetupBuild {
    @NotBlank(message = "There is no layout id")
    private String id;

    private String scale;

    @Min(value = 0, message = "The budget has to be at least 0")
    private Double maxBudget;

    @NotBlank(message = "Ecosistemul țintă este obligatoriu")
    private String targetEcosystem;

    @Valid
    @NotEmpty(message = "Trebuie să existe cel puțin o cameră!")
    private List<Room> rooms;

    @Valid
    @NotEmpty(message = "Trebuie să existe cel puțin un device plasat!")
    private List<PlacedDevice> devices;
}