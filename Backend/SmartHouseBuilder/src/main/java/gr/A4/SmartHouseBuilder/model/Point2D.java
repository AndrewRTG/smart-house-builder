package gr.A4.SmartHouseBuilder.model;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Point2D {
    @NotNull(message = "Coordonata X este obligatorie")
    private Double x;

    @NotNull(message = "Coordonata Y este obligatorie")
    private Double y;
}