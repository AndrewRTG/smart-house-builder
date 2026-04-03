package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Door {
    private String id;
    private String type = "door";
    private double positionX;
    private double positionY;
    private double width;
    private double height;
    private String wallId;
}