package gr.A4.SmartHouseBuilder.model;
import lombok.Data;

@Data
public class PlacedDevice {
    private Device device;
    private Double x;
    private Double y;
}