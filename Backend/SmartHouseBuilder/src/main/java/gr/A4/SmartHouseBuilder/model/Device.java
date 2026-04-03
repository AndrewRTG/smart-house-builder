package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Device {
    private String id;
    private String type;
    private String name;
    private String brand;
    private double positionX;
    private double positionY;
    private String status;
    private Map<String, Object> properties;
}