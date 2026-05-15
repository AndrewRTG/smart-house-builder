package gr.A4.SmartHouseBuilder.team2.dto;

import lombok.Data;

@Data
public class DeviceDTO {
    private String id;
    private String name;
    private Double price;
    private String ecosystem;
    private String protocol;
    private Integer lumens;
    private Boolean requiresPlug;
    private Double rangeRadius;
    private String deviceType;
    private String mountType;
    private Double fieldOfView;
    private Double powerConsumption;
    private String communicationFrequency;
    private Double width;
}
