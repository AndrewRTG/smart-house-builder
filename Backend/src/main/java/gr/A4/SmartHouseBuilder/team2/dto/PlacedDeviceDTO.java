package gr.A4.SmartHouseBuilder.team2.dto;

import lombok.Data;

@Data
public class PlacedDeviceDTO {
    private String id;
    private String name;
    private String category;
    private String protocol;
    private String ecosystem;
    private Double x;
    private Double y;
}
