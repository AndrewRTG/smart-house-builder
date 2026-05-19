package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
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

    private List<Long> deviceIds;

    private boolean isPublic;
}