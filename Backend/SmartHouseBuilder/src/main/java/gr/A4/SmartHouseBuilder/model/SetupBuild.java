package gr.A4.SmartHouseBuilder.model;
import lombok.Data;
import java.util.List;

@Data
public class SetupBuild {
    private Double maxBudget;
    private String targetEcosystem;
    private List<PlacedDevice> devices;
}