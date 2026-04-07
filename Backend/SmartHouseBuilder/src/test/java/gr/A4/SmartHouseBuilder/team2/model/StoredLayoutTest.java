package gr.A4.SmartHouseBuilder.team2.model;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class StoredLayoutTest {

    @Test
    void constructor_setsAllFields() {
        Long id = 1L;
        Instant now = Instant.now();
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("dto-1");

        StoredLayout layout = new StoredLayout(id, now, dto);

        assertThat(layout.id()).isEqualTo(id);
        assertThat(layout.createdAt()).isEqualTo(now);
        assertThat(layout.data()).isSameInstanceAs(dto);
    }

    @Test
    void constructor_acceptsNullData() {
        StoredLayout layout = new StoredLayout(1L, Instant.now(), null);
        assertThat(layout.data()).isNull();
    }

    @Test
    void constructor_acceptsNullCreatedAt() {
        StoredLayout layout = new StoredLayout(1L, null, new SetupBuildDTO());
        assertThat(layout.createdAt()).isNull();
    }

    @Test
    void equals_twoRecordsWithSameFieldsAreEqual() {
        Instant now = Instant.parse("2025-01-01T00:00:00Z");
        SetupBuildDTO dto = new SetupBuildDTO();

        StoredLayout layout1 = new StoredLayout(1L, now, dto);
        StoredLayout layout2 = new StoredLayout(1L, now, dto);

        assertThat(layout1).isEqualTo(layout2);
    }

    @Test
    void equals_recordsWithDifferentIdsAreNotEqual() {
        Instant now = Instant.now();
        SetupBuildDTO dto = new SetupBuildDTO();

        StoredLayout layout1 = new StoredLayout(1L, now, dto);
        StoredLayout layout2 = new StoredLayout(2L, now, dto);

        assertThat(layout1).isNotEqualTo(layout2);
    }

    @Test
    void equals_recordsWithDifferentTimestampsAreNotEqual() {
        SetupBuildDTO dto = new SetupBuildDTO();

        StoredLayout layout1 = new StoredLayout(1L, Instant.parse("2025-01-01T00:00:00Z"), dto);
        StoredLayout layout2 = new StoredLayout(1L, Instant.parse("2025-06-01T00:00:00Z"), dto);

        assertThat(layout1).isNotEqualTo(layout2);
    }

    @Test
    void hashCode_sameForEqualRecords() {
        Instant now = Instant.parse("2025-01-01T00:00:00Z");
        SetupBuildDTO dto = new SetupBuildDTO();

        StoredLayout layout1 = new StoredLayout(1L, now, dto);
        StoredLayout layout2 = new StoredLayout(1L, now, dto);

        assertThat(layout1.hashCode()).isEqualTo(layout2.hashCode());
    }

    @Test
    void toString_containsIdAndCreatedAt() {
        Instant now = Instant.parse("2025-03-15T12:00:00Z");
        StoredLayout layout = new StoredLayout(42L, now, null);
        String str = layout.toString();

        assertThat(str).contains("42");
        assertThat(str).contains("2025-03-15");
    }

    @Test
    void idAccessor_returnsStoredId() {
        StoredLayout layout = new StoredLayout(99L, Instant.now(), null);
        assertThat(layout.id()).isEqualTo(99L);
    }

    @Test
    void createdAtAccessor_returnsStoredInstant() {
        Instant ts = Instant.parse("2024-12-31T23:59:59Z");
        StoredLayout layout = new StoredLayout(1L, ts, null);
        assertThat(layout.createdAt()).isEqualTo(ts);
    }

    @Test
    void dataAccessor_returnsSameInstance() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("ref-check");
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        assertThat(layout.data()).isSameInstanceAs(dto);
    }
}