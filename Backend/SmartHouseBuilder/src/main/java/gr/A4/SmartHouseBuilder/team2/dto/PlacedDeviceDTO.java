package gr.A4.SmartHouseBuilder.team2.dto;

import lombok.Data;

@Data
public class PlacedDeviceDTO {
    private PointDTO coordinates;
    private Double rotationAngle;
    private DeviceDTO device;
}
