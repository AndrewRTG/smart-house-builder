package gr.A4.SmartHouseBuilder.model;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Setter
@Getter
public class Device {
    private String name;
    private String deviceType;
    private String protocol;
    private String ecosystem;
}