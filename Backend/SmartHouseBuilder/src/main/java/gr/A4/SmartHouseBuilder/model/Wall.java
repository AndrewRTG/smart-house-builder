package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wall {
    private String id;
    private String type = "wall";
    private double startX;
    private double startY;
    private double endX;
    private double endY;
    private double thickness;
}