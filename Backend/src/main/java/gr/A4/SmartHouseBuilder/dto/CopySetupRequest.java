package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CopySetupRequest {
    @NotBlank(message = "Setup name is required")
    private String name;
}
