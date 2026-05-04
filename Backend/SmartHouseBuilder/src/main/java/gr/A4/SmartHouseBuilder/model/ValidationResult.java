package gr.A4.SmartHouseBuilder.model;
import lombok.*;

@Data
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ValidationResult {
    private boolean valid;
    private String level; // "ERROR", "INFO", "WARNING"
    private String message;
}