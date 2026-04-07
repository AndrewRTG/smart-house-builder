package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LayoutServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private LayoutService layoutService;

    @BeforeEach
    void setUp() {
        layoutService = new LayoutService();
        ReflectionTestUtils.setField(layoutService, "restTemplate", restTemplate);
    }

    // ---- saveLayout tests ----

    @Test
    void saveLayout_firstCall_returnsIdOne() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        assertThat(id).isEqualTo(1L);
    }

    @Test
    void saveLayout_multipleCalls_returnsIncrementalIds() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long first = layoutService.saveLayout(dto);
        Long second = layoutService.saveLayout(dto);
        Long third = layoutService.saveLayout(dto);
        assertThat(first).isEqualTo(1L);
        assertThat(second).isEqualTo(2L);
        assertThat(third).isEqualTo(3L);
    }

    @Test
    void saveLayout_storesPayload_canBeRetrievedById() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("layout-abc");
        dto.setScale("1:100");
        Long id = layoutService.saveLayout(dto);

        StoredLayout stored = layoutService.getLayoutById(id);
        assertThat(stored).isNotNull();
        assertThat(stored.data()).isSameAs(dto);
        assertThat(stored.id()).isEqualTo(id);
        assertThat(stored.createdAt()).isNotNull();
    }

    // ---- getLayoutById tests ----

    @Test
    void getLayoutById_existingId_returnsStoredLayout() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setTargetEcosystem("Google");
        Long id = layoutService.saveLayout(dto);

        StoredLayout result = layoutService.getLayoutById(id);
        assertThat(result).isNotNull();
        assertThat(result.data().getTargetEcosystem()).isEqualTo("Google");
    }

    @Test
    void getLayoutById_nonExistentId_returnsNull() {
        StoredLayout result = layoutService.getLayoutById(9999L);
        assertThat(result).isNull();
    }

    @Test
    void getLayoutById_negativeId_returnsNull() {
        StoredLayout result = layoutService.getLayoutById(-1L);
        assertThat(result).isNull();
    }

    // ---- getAllLayouts tests ----

    @Test
    void getAllLayouts_emptyStore_returnsEmptyList() {
        List<StoredLayout> result = layoutService.getAllLayouts();
        assertThat(result).isEmpty();
    }

    @Test
    void getAllLayouts_multipleLayouts_returnsSortedById() {
        SetupBuildDTO dto1 = new SetupBuildDTO();
        dto1.setId("first");
        SetupBuildDTO dto2 = new SetupBuildDTO();
        dto2.setId("second");
        SetupBuildDTO dto3 = new SetupBuildDTO();
        dto3.setId("third");

        Long id1 = layoutService.saveLayout(dto1);
        Long id2 = layoutService.saveLayout(dto2);
        Long id3 = layoutService.saveLayout(dto3);

        List<StoredLayout> layouts = layoutService.getAllLayouts();
        assertThat(layouts).hasSize(3);
        assertThat(layouts.get(0).id()).isEqualTo(id1);
        assertThat(layouts.get(1).id()).isEqualTo(id2);
        assertThat(layouts.get(2).id()).isEqualTo(id3);
    }

    @Test
    void getAllLayouts_singleLayout_returnsListWithOneEntry() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setScale("1:50");
        layoutService.saveLayout(dto);

        List<StoredLayout> result = layoutService.getAllLayouts();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).data().getScale()).isEqualTo("1:50");
    }

    // ---- sendAndReceive tests ----

    @Test
    void sendAndReceive_successfulResponse_returnsBody() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        Object expectedBody = new Object();
        ResponseEntity<Object> responseEntity = ResponseEntity.ok(expectedBody);
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenReturn(responseEntity);

        Object result = layoutService.sendAndReceive(layout);
        assertThat(result).isSameAs(expectedBody);
    }

    @Test
    void sendAndReceive_connectionRefused_returnsNull() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

        Object result = layoutService.sendAndReceive(layout);
        assertThat(result).isNull();
    }

    @Test
    void sendAndReceive_nullBody_returnsNull() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        ResponseEntity<Object> responseEntity = ResponseEntity.ok(null);
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenReturn(responseEntity);

        Object result = layoutService.sendAndReceive(layout);
        assertThat(result).isNull();
    }

    // ---- validateLayout tests ----

    @Test
    void validateLayout_successfulResponse_returnsSetupBuildDTO() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setMaxBudget(5000.0);
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        SetupBuildDTO responseDto = new SetupBuildDTO();
        responseDto.setMaxBudget(5000.0);
        ResponseEntity<SetupBuildDTO> responseEntity = ResponseEntity.ok(responseDto);
        when(restTemplate.postForEntity(anyString(), any(), eq(SetupBuildDTO.class)))
                .thenReturn(responseEntity);

        SetupBuildDTO result = layoutService.validateLayout(layout);
        assertThat(result).isNotNull();
        assertThat(result.getMaxBudget()).isEqualTo(5000.0);
    }

    @Test
    void validateLayout_exceptionThrown_returnsNull() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        when(restTemplate.postForEntity(anyString(), any(), eq(SetupBuildDTO.class)))
                .thenThrow(new RuntimeException("Timeout"));

        SetupBuildDTO result = layoutService.validateLayout(layout);
        assertThat(result).isNull();
    }

    @Test
    void validateLayout_nullBody_returnsNull() {
        SetupBuildDTO dto = new SetupBuildDTO();
        Long id = layoutService.saveLayout(dto);
        StoredLayout layout = layoutService.getLayoutById(id);

        ResponseEntity<SetupBuildDTO> responseEntity = ResponseEntity.ok(null);
        when(restTemplate.postForEntity(anyString(), any(), eq(SetupBuildDTO.class)))
                .thenReturn(responseEntity);

        SetupBuildDTO result = layoutService.validateLayout(layout);
        assertThat(result).isNull();
    }

    // ---- additional edge cases ----

    @Test
    void saveLayout_nullPayload_storesNullData() {
        Long id = layoutService.saveLayout(null);
        StoredLayout stored = layoutService.getLayoutById(id);
        assertThat(stored).isNotNull();
        assertThat(stored.data()).isNull();
    }

    @Test
    void getAllLayouts_returnsUnmodifiableSnapshot() {
        SetupBuildDTO dto = new SetupBuildDTO();
        layoutService.saveLayout(dto);
        List<StoredLayout> list1 = layoutService.getAllLayouts();
        layoutService.saveLayout(dto);
        List<StoredLayout> list2 = layoutService.getAllLayouts();
        // each call returns fresh list
        assertThat(list1).hasSize(1);
        assertThat(list2).hasSize(2);
    }
}