package gr.A4.SmartHouseBuilder.team2.model;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import lombok.Data;

import java.time.Instant;

@Data
public class StoredLayout {
    private Long id;
    private Instant createdAt;
    private SetupBuildDTO content;
}
