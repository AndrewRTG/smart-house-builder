package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetupRequest {
    @NotBlank(message = "Setup name is required")
    private String name;

    private String description;

    @NotNull(message = "Device list cannot be null")
    private List<Long> deviceIds;

    private boolean isPublic;
}
