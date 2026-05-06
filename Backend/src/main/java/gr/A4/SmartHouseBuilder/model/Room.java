package gr.A4.SmartHouseBuilder.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class Room {

    @NotBlank(message = "ID-ul camerei este obligatoriu!")
    private String id;

    private Double squareMeters;
    private String wallType;

    @Valid
    private List<Segment2D> walls;

    @Valid
    private List<Segment2D> doors;

    @Valid
    private List<Segment2D> windows;

    @Valid
    private List<Point2D> plugs;
}
