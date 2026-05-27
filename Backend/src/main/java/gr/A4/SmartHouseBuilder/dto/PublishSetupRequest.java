package gr.A4.SmartHouseBuilder.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublishSetupRequest {
    private String description;
    private List<String> tags;
}
