package gr.A4.SmartHouseBuilder.model;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Segment2D {
    @NotNull(message = "x1 este obligatoriu")
    private Double x1;
    @NotNull(message = "y1 este obligatoriu")
    private Double y1;
    @NotNull(message = "x2 este obligatoriu")
    private Double x2;
    @NotNull(message = "y2 este obligatoriu")
    private Double y2;
}