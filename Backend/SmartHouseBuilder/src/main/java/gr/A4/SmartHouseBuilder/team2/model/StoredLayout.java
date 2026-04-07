package gr.A4.SmartHouseBuilder.team2.model;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;

import java.time.Instant;

public record StoredLayout(Long id, Instant createdAt, SetupBuildDTO data) {
}
