package gr.A4.SmartHouseBuilder.team2.dto;
import lombok.Data;
import java.util.List;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

@Data
public class SetupBuildDTO {
    private String id;
    private String scale;
    private Double maxBudget;
    private String targetEcosystem;
    private List<RoomDTO> rooms;
    private List<PlacedDeviceDTO> devices;
    private List<ValidationResult> errors;
}
