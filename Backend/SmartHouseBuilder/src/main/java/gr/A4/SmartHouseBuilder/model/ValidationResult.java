package gr.A4.SmartHouseBuilder.model;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidationResult {
    private boolean valid;
    private String level; // "ERROR", "INFO", "WARNING"
    private String message;
}