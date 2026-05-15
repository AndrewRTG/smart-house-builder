package gr.A4.SmartHouseBuilder.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ValidationResult {
    private boolean valid;
    private String level;
    private String message;
}
