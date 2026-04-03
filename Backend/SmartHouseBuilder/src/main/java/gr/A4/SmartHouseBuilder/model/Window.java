package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Window {
    private String id;
    private String type = "window";
    private double positionX;
    private double positionY;
    private double width;
    private double height;
    private String wallId;
}