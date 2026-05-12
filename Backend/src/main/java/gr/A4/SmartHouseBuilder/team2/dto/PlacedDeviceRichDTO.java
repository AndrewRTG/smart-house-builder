package gr.A4.SmartHouseBuilder.team2.dto;

import lombok.Data;

@Data
public class PlacedDeviceRichDTO {
    private CoordinatesDTO coordinates;
    private Double rotationAngle;
    private DeviceDTO device;
}

