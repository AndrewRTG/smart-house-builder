package gr.A4.SmartHouseBuilder.team2.model;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class StoredLayoutTest {

    @Test
    void constructor_setsAllFields() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("test-layout");
        Instant now = Instant.now();

        StoredLayout layout = new StoredLayout(1L, now, dto);

        assertThat(layout.id()).isEqualTo(1L);
        assertThat(layout.createdAt()).isEqualTo(now);
        assertThat(layout.data()).isSameAs(dto);
    }

    @Test
    void constructor_withNullData_isAllowed() {
        Instant now = Instant.now();

        StoredLayout layout = new StoredLayout(2L, now, null);

        assertThat(layout.id()).isEqualTo(2L);
        assertThat(layout.createdAt()).isEqualTo(now);
        assertThat(layout.data()).isNull();
    }

    @Test
    void equality_twoLayoutsWithSameValues_areEqual() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Instant now = Instant.parse("2024-01-01T00:00:00Z");

        StoredLayout layout1 = new StoredLayout(1L, now, dto);
        StoredLayout layout2 = new StoredLayout(1L, now, dto);

        assertThat(layout1).isEqualTo(layout2);
    }

    @Test
    void equality_twoLayoutsWithDifferentIds_areNotEqual() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Instant now = Instant.now();

        StoredLayout layout1 = new StoredLayout(1L, now, dto);
        StoredLayout layout2 = new StoredLayout(2L, now, dto);

        assertThat(layout1).isNotEqualTo(layout2);
    }

    @Test
    void equality_twoLayoutsWithDifferentTimestamps_areNotEqual() {
        SetupBuildDTO dto = new SetupBuildDTO();

        StoredLayout layout1 = new StoredLayout(1L, Instant.parse("2024-01-01T00:00:00Z"), dto);
        StoredLayout layout2 = new StoredLayout(1L, Instant.parse("2024-06-01T00:00:00Z"), dto);

        assertThat(layout1).isNotEqualTo(layout2);
    }

    @Test
    void hashCode_twoEqualLayouts_haveSameHashCode() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("same");
        Instant now = Instant.parse("2024-01-01T00:00:00Z");

        StoredLayout layout1 = new StoredLayout(1L, now, dto);
        StoredLayout layout2 = new StoredLayout(1L, now, dto);

        assertThat(layout1.hashCode()).isEqualTo(layout2.hashCode());
    }

    @Test
    void toString_containsId() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Instant now = Instant.now();
        StoredLayout layout = new StoredLayout(99L, now, dto);

        assertThat(layout.toString()).contains("99");
    }

    @Test
    void id_accessor_returnsStoredId() {
        StoredLayout layout = new StoredLayout(42L, Instant.now(), new SetupBuildDTO());
        assertThat(layout.id()).isEqualTo(42L);
    }

    @Test
    void createdAt_accessor_returnsStoredInstant() {
        Instant ts = Instant.parse("2025-03-15T10:30:00Z");
        StoredLayout layout = new StoredLayout(1L, ts, new SetupBuildDTO());
        assertThat(layout.createdAt()).isEqualTo(ts);
    }
}