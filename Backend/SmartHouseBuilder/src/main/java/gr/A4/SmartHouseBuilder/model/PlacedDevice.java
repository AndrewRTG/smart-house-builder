package gr.A4.SmartHouseBuilder.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class PlacedDevice {

    @Valid
    @NotNull(message = "Coordonatele device-ului sunt obligatorii")
    private Point2D coordinates;

    private Double rotationAngle;

    @Valid
    @NotNull(message = "Informațiile despre device sunt obligatorii")
    private Device device;
}