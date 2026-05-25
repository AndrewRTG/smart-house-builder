package gr.A4.SmartHouseBuilder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isPublic")
    private boolean isPublic;

    private List<String> tags;

    private String thumbnailUrl;

    private String canvasState;

    private String deviceSnapshots;
}