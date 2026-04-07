package gr.A4.SmartHouseBuilder.team2.model;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class StoredLayoutTest {

    @Test
    void constructor_setsAllComponents() {
        Long id = 1L;
        Instant now = Instant.now();
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("layout-1");

        StoredLayout layout = new StoredLayout(id, now, dto);

        assertThat(layout.id()).isEqualTo(1L);
        assertThat(layout.createdAt()).isEqualTo(now);
        assertThat(layout.data()).isSameAs(dto);
    }

    @Test
    void id_accessor_returnsCorrectValue() {
        StoredLayout layout = new StoredLayout(42L, Instant.now(), null);
        assertThat(layout.id()).isEqualTo(42L);
    }

    @Test
    void createdAt_accessor_returnsCorrectInstant() {
        Instant timestamp = Instant.parse("2025-01-01T12:00:00Z");
        StoredLayout layout = new StoredLayout(1L, timestamp, null);
        assertThat(layout.createdAt()).isEqualTo(timestamp);
    }

    @Test
    void data_accessor_returnsSetupBuildDTO() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setScale("1:200");
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);
        assertThat(layout.data().getScale()).isEqualTo("1:200");
    }

    @Test
    void data_accessor_allowsNull() {
        StoredLayout layout = new StoredLayout(1L, Instant.now(), null);
        assertThat(layout.data()).isNull();
    }

    @Test
    void equals_sameValues_areEqual() {
        Instant ts = Instant.parse("2025-06-01T00:00:00Z");
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("x");

        StoredLayout l1 = new StoredLayout(1L, ts, dto);
        StoredLayout l2 = new StoredLayout(1L, ts, dto);

        assertThat(l1).isEqualTo(l2);
    }

    @Test
    void equals_differentId_notEqual() {
        Instant ts = Instant.now();
        SetupBuildDTO dto = new SetupBuildDTO();

        StoredLayout l1 = new StoredLayout(1L, ts, dto);
        StoredLayout l2 = new StoredLayout(2L, ts, dto);

        assertThat(l1).isNotEqualTo(l2);
    }

    @Test
    void equals_differentCreatedAt_notEqual() {
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout l1 = new StoredLayout(1L, Instant.parse("2025-01-01T00:00:00Z"), dto);
        StoredLayout l2 = new StoredLayout(1L, Instant.parse("2025-06-01T00:00:00Z"), dto);
        assertThat(l1).isNotEqualTo(l2);
    }

    @Test
    void hashCode_sameValues_areEqual() {
        Instant ts = Instant.parse("2025-01-01T00:00:00Z");
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("hash-test");

        StoredLayout l1 = new StoredLayout(5L, ts, dto);
        StoredLayout l2 = new StoredLayout(5L, ts, dto);

        assertThat(l1.hashCode()).isEqualTo(l2.hashCode());
    }

    @Test
    void toString_containsAllComponents() {
        Instant ts = Instant.parse("2025-03-15T10:30:00Z");
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(99L, ts, dto);

        String str = layout.toString();
        assertThat(str).contains("99");
        assertThat(str).contains("2025-03-15");
    }

    @Test
    void record_isImmutable_components_cannotBeChanged() {
        // Java records expose only accessors, no setters - verifying the record contract
        SetupBuildDTO dto = new SetupBuildDTO();
        StoredLayout layout = new StoredLayout(1L, Instant.now(), dto);

        // The same reference is returned each call (no copy)
        assertThat(layout.data()).isSameAs(dto);
        assertThat(layout.data()).isSameAs(layout.data());
    }
}