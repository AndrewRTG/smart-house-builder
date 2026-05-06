package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Setter
@Getter
public class PlacedDevice {
    private Device device;
    private Double x;
    private Double y;
}
