package gr.A4.SmartHouseBuilder.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
public class ValidationResult {
    private boolean isValid;
    private String severityLevel;
    private String message;

}
