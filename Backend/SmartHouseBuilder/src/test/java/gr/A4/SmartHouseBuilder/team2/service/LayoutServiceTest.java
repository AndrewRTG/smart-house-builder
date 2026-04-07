package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LayoutServiceTest {

    private LayoutService layoutService;

    @BeforeEach
    void setUp() {
        layoutService = new LayoutService();
    }

    // ---- saveLayout ----

    @Test
    void saveLayout_returnsIncrementingIds() {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        SetupBuildDTO dto2 = new SetupBuildDTO();

        Long id1 = layoutService.saveLayout(dto1);
        Long id2 = layoutService.saveLayout(dto2);

        assertThat(id1).isEqualTo(1L);
        assertThat(id2).isEqualTo(2L);
    }

    @Test
    void saveLayout_storesPayload() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("layout-1");
        dto.setScale("1:100");

        Long id = layoutService.saveLayout(dto);
        StoredLayout stored = layoutService.getLayoutById(id);

        assertThat(stored).isNotNull();
        assertThat(stored.data()).isSameAs(dto);
    }

    @Test
    void saveLayout_assignsCreatedAt() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout stored = layoutService.getLayoutById(id);

        assertThat(stored.createdAt()).isNotNull();
    }

    @Test
    void saveLayout_withNullPayload_storesNullData() {
        Long id = layoutService.saveLayout(null);
        StoredLayout stored = layoutService.getLayoutById(id);

        assertThat(stored).isNotNull();
        assertThat(stored.data()).isNull();
    }

    // ---- getLayoutById ----

    @Test
    void getLayoutById_returnsNullForNonExistentId() {
        assertThat(layoutService.getLayoutById(999L)).isNull();
    }

    @Test
    void getLayoutById_returnsCorrectLayout() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("abc");
        Long id = layoutService.saveLayout(dto);

        StoredLayout result = layoutService.getLayoutById(id);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(id);
        assertThat(result.data().getId()).isEqualTo("abc");
    }

    @Test
    void getLayoutById_doesNotReturnOtherLayouts() {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        dto1.setId("first");
        SetupBuildDTO dto2 = new SetupBuildDTO();
        dto2.setId("second");

        Long id1 = layoutService.saveLayout(dto1);
        Long id2 = layoutService.saveLayout(dto2);

        assertThat(layoutService.getLayoutById(id1).data().getId()).isEqualTo("first");
        assertThat(layoutService.getLayoutById(id2).data().getId()).isEqualTo("second");
    }

    // ---- getAllLayouts ----

    @Test
    void getAllLayouts_returnsEmptyListWhenNoLayouts() {
        assertThat(layoutService.getAllLayouts()).isEmpty();
    }

    @Test
    void getAllLayouts_returnsAllSavedLayouts() {
        layoutService.saveLayout(new SetupBuildDTO());
        layoutService.saveLayout(new SetupBuildDTO());
        layoutService.saveLayout(new SetupBuildDTO());

        assertThat(layoutService.getAllLayouts()).hasSize(3);
    }

    @Test
    void getAllLayouts_returnsSortedById() {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        SetupBuildDTO dto2 = new SetupBuildDTO();
        SetupBuildDTO dto3 = new SetupBuildDTO();

        layoutService.saveLayout(dto1);
        layoutService.saveLayout(dto2);
        layoutService.saveLayout(dto3);

        List<StoredLayout> layouts = layoutService.getAllLayouts();

        assertThat(layouts.get(0).id()).isLessThan(layouts.get(1).id());
        assertThat(layouts.get(1).id()).isLessThan(layouts.get(2).id());
    }

    @Test
    void getAllLayouts_returnsSingleLayout() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("solo");
        Long id = layoutService.saveLayout(dto);

        List<StoredLayout> layouts = layoutService.getAllLayouts();

        assertThat(layouts).hasSize(1);
        assertThat(layouts.get(0).id()).isEqualTo(id);
    }

    // ---- sendAndReceive ----

    @Test
    void sendAndReceive_returnsNullWhenServerUnavailable() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        // No server running, RestTemplate should throw and be caught
        Object result = layoutService.sendAndReceive(layout);
        assertThat(result).isNull();
    }

    @Test
    void sendAndReceive_returnsNullForNullLayout() {
        Object result = layoutService.sendAndReceive(null);
        assertThat(result).isNull();
    }

    // ---- validateLayout ----

    @Test
    void validateLayout_returnsNullWhenServerUnavailable() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        // No server running, RestTemplate should throw and be caught
        SetupBuildDTO result = layoutService.validateLayout(layout);
        assertThat(result).isNull();
    }

    @Test
    void validateLayout_returnsNullForNullLayout() {
        SetupBuildDTO result = layoutService.validateLayout(null);
        assertThat(result).isNull();
    }
}