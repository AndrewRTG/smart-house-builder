package gr.A4.SmartHouseBuilder.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Setter
@Getter
public class SetupBuild {
    private String id;
    private String scale;
    private Double maxBudget;
    private String targetEcosystem;
    private List<Room> rooms;
    private List<PlacedDevice> devices;
}
