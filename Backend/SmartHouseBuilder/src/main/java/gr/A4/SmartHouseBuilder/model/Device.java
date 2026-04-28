package gr.A4.SmartHouseBuilder.model;
import lombok.Data;

@Data
public class Device {
    private String name;
    private String deviceType;
    private String protocol;
    private String ecosystem;
}