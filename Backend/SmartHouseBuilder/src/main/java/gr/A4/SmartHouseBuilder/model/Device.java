package gr.A4.SmartHouseBuilder.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Device {
    @NotBlank(message = "ID-ul device-ului este obligatoriu!")
    private String id;

    @NotBlank(message = "Numele device-ului este obligatoriu!")
    private String name;

    @Min(value = 0, message = "Prețul nu poate fi negativ")
    private Double price;

    @NotNull(message = "Ecosistemul este obligatoriu este obligatoriu")
    private String ecosystem;
    private String protocol;
    private Double lumens;
    private Boolean requiresPlug;
    private Double rangeRadius;
    private String deviceType;
    private String mountType;
    private Double fieldOfView;
    private Double powerConsumption;
    private String comunicationFrequency;
    private Double width;
}