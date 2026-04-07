package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class LayoutServiceTest {

    private LayoutService layoutService;

    @BeforeEach
    void setUp() {
        layoutService = new LayoutService();
    }

    // ── saveLayout ────────────────────────────────────────────────────────────

    @Test
    void saveLayout_returnsIncrementingIds() {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        SetupBuildDTO dto2 = new SetupBuildDTO();

        Long id1 = layoutService.saveLayout(dto1);
        Long id2 = layoutService.saveLayout(dto2);

        assertThat(id1).isNotNull();
        assertThat(id2).isNotNull();
        assertThat(id2).isGreaterThan(id1);
    }

    @Test
    void saveLayout_firstIdIsPositive() {
        Long id = layoutService.saveLayout(new SetupBuildDTO());
        assertThat(id).isPositive();
    }

    @Test
    void saveLayout_storesPayloadCorrectly() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("layout-1");
        dto.setScale("1:50");
        dto.setMaxBudget(5000.0);

        Long id = layoutService.saveLayout(dto);
        StoredLayout stored = layoutService.getLayoutById(id);

        assertThat(stored).isNotNull();
        assertThat(stored.data()).isSameInstanceAs(dto);
        assertThat(stored.data().getId()).isEqualTo("layout-1");
        assertThat(stored.data().getScale()).isEqualTo("1:50");
    }

    @Test
    void saveLayout_setsCreatedAtNearNow() {
        Instant before = Instant.now();
        Long id = layoutService.saveLayout(new SetupBuildDTO());
        Instant after = Instant.now();

        StoredLayout stored = layoutService.getLayoutById(id);

        assertThat(stored.createdAt()).isAfterOrEqualTo(before);
        assertThat(stored.createdAt()).isBeforeOrEqualTo(after);
    }

    @Test
    void saveLayout_withNullPayload_storesNullData() {
        Long id = layoutService.saveLayout(null);
        StoredLayout stored = layoutService.getLayoutById(id);

        assertThat(stored).isNotNull();
        assertThat(stored.data()).isNull();
    }

    // ── getLayoutById ─────────────────────────────────────────────────────────

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
    void getLayoutById_returnsNullForUnknownId() {
        StoredLayout result = layoutService.getLayoutById(9999L);
        assertThat(result).isNull();
    }

    @Test
    void getLayoutById_doesNotConflictBetweenMultipleLayouts() {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        dto1.setId("first");
        SetupBuildDTO dto2 = new SetupBuildDTO();
        dto2.setId("second");

        Long id1 = layoutService.saveLayout(dto1);
        Long id2 = layoutService.saveLayout(dto2);

        assertThat(layoutService.getLayoutById(id1).data().getId()).isEqualTo("first");
        assertThat(layoutService.getLayoutById(id2).data().getId()).isEqualTo("second");
    }

    // ── getAllLayouts ─────────────────────────────────────────────────────────

    @Test
    void getAllLayouts_returnsEmptyListWhenNoLayouts() {
        List<StoredLayout> layouts = layoutService.getAllLayouts();
        assertThat(layouts).isNotNull().isEmpty();
    }

    @Test
    void getAllLayouts_returnsAllSavedLayouts() {
        layoutService.saveLayout(new SetupBuildDTO());
        layoutService.saveLayout(new SetupBuildDTO());
        layoutService.saveLayout(new SetupBuildDTO());

        List<StoredLayout> layouts = layoutService.getAllLayouts();

        assertThat(layouts).hasSize(3);
    }

    @Test
    void getAllLayouts_returnsSortedById() {
        Long id1 = layoutService.saveLayout(new SetupBuildDTO());
        Long id2 = layoutService.saveLayout(new SetupBuildDTO());
        Long id3 = layoutService.saveLayout(new SetupBuildDTO());

        List<StoredLayout> layouts = layoutService.getAllLayouts();

        assertThat(layouts).extracting(StoredLayout::id)
                .containsExactly(id1, id2, id3);
    }

    @Test
    void getAllLayouts_returnsSingleLayout() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("only");
        Long id = layoutService.saveLayout(dto);

        List<StoredLayout> layouts = layoutService.getAllLayouts();

        assertThat(layouts).hasSize(1);
        assertThat(layouts.get(0).id()).isEqualTo(id);
    }

    // ── sendAndReceive ────────────────────────────────────────────────────────

    @Test
    void sendAndReceive_returnsNullWhenRemoteUnavailable() {
        // No server listening at localhost:20025, expect null from caught exception
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        Object result = layoutService.sendAndReceive(layout);

        assertThat(result).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendAndReceive_returnsBodyOnSuccess() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        Object expectedBody = new Object();

        try (MockedConstruction<RestTemplate> mockedRt = mockConstruction(RestTemplate.class,
                (mock, context) -> {
                    ResponseEntity<Object> response = mock(ResponseEntity.class);
                    when(response.getBody()).thenReturn(expectedBody);
                    when(mock.postForEntity(anyString(), any(), eq(Object.class)))
                            .thenReturn(response);
                })) {

            // Need a fresh service instance so it uses the mocked RestTemplate
            LayoutService freshService = new LayoutService();
            Long freshId = freshService.saveLayout(dto);
            StoredLayout freshLayout = freshService.getLayoutById(freshId);

            Object result = freshService.sendAndReceive(freshLayout);

            assertThat(result).isEqualTo(expectedBody);
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendAndReceive_returnsNullOnException() {
        SetupBuildDTO dto = new SetupBuildDTO();

        try (MockedConstruction<RestTemplate> mockedRt = mockConstruction(RestTemplate.class,
                (mock, context) ->
                        when(mock.postForEntity(anyString(), any(), eq(Object.class)))
                                .thenThrow(new ResourceAccessException("Connection refused")))) {

            LayoutService freshService = new LayoutService();
            Long freshId = freshService.saveLayout(dto);
            StoredLayout freshLayout = freshService.getLayoutById(freshId);

            Object result = freshService.sendAndReceive(freshLayout);

            assertThat(result).isNull();
        }
    }

    // ── validateLayout ────────────────────────────────────────────────────────

    @Test
    void validateLayout_returnsNullWhenRemoteUnavailable() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        SetupBuildDTO result = layoutService.validateLayout(layout);

        assertThat(result).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void validateLayout_returnsBodyOnSuccess() {
        SetupBuildDTO dto = new SetupBuildDTO();
        SetupBuildDTO validatedDto = new SetupBuildDTO();
        validatedDto.setId("validated");

        try (MockedConstruction<RestTemplate> mockedRt = mockConstruction(RestTemplate.class,
                (mock, context) -> {
                    ResponseEntity<SetupBuildDTO> response = mock(ResponseEntity.class);
                    when(response.getBody()).thenReturn(validatedDto);
                    when(mock.postForEntity(anyString(), any(), eq(SetupBuildDTO.class)))
                            .thenReturn(response);
                })) {

            LayoutService freshService = new LayoutService();
            Long freshId = freshService.saveLayout(dto);
            StoredLayout freshLayout = freshService.getLayoutById(freshId);

            SetupBuildDTO result = freshService.validateLayout(freshLayout);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo("validated");
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void validateLayout_returnsNullOnException() {
        SetupBuildDTO dto = new SetupBuildDTO();

        try (MockedConstruction<RestTemplate> mockedRt = mockConstruction(RestTemplate.class,
                (mock, context) ->
                        when(mock.postForEntity(anyString(), any(), eq(SetupBuildDTO.class)))
                                .thenThrow(new ResourceAccessException("timeout")))) {

            LayoutService freshService = new LayoutService();
            Long freshId = freshService.saveLayout(dto);
            StoredLayout freshLayout = freshService.getLayoutById(freshId);

            SetupBuildDTO result = freshService.validateLayout(freshLayout);

            assertThat(result).isNull();
        }
    }

    // ── edge/regression cases ─────────────────────────────────────────────────

    @Test
    void saveMultipleLayouts_eachHasUniqueId() {
        int count = 10;
        Long[] ids = new Long[count];
        for (int i = 0; i < count; i++) {
            ids[i] = layoutService.saveLayout(new SetupBuildDTO());
        }

        // All IDs should be distinct
        assertThat(ids).doesNotHaveDuplicates();
    }

    @Test
    void getAllLayouts_returnsImmutableSnapshot() {
        layoutService.saveLayout(new SetupBuildDTO());
        List<StoredLayout> snapshot1 = layoutService.getAllLayouts();

        layoutService.saveLayout(new SetupBuildDTO());
        List<StoredLayout> snapshot2 = layoutService.getAllLayouts();

        assertThat(snapshot1).hasSize(1);
        assertThat(snapshot2).hasSize(2);
    }
}