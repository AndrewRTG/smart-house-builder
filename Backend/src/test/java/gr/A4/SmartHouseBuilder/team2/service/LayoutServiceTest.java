package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.engine.CompatibilityEngine;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.util.ModelMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LayoutServiceTest {

    @Mock
    private CompatibilityEngine compatibilityEngine;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private LayoutService layoutService;

    private SetupBuildDTO dto;
    private StoredLayout layout;

    @BeforeEach
    void setUp() {
        dto = new SetupBuildDTO();
        layout = new StoredLayout();
        layout.setContent(dto);
    }

    @Test
    void validateLayout_setsErrorsFromEngineOnDto() {
        SetupBuild engineModel = new SetupBuild();
        ValidationResult result = new ValidationResult(true, "INFO", "ok");

        when(modelMapper.toEngineModel(dto)).thenReturn(engineModel);
        when(compatibilityEngine.runAllChecks(engineModel)).thenReturn(List.of(result));

        SetupBuildDTO returned = layoutService.validateLayout(layout);

        assertSame(dto, returned);
        assertNotNull(returned.getErrors());
        assertEquals(1, returned.getErrors().size());
        assertSame(result, returned.getErrors().get(0));
        verify(modelMapper).toEngineModel(dto);
        verify(compatibilityEngine).runAllChecks(engineModel);
    }

    @Test
    void validateLayout_acceptsEmptyResults() {
        when(modelMapper.toEngineModel(dto)).thenReturn(new SetupBuild());
        when(compatibilityEngine.runAllChecks(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of());

        SetupBuildDTO returned = layoutService.validateLayout(layout);

        assertNotNull(returned.getErrors());
        assertTrue(returned.getErrors().isEmpty());
    }

    @Test
    void saveLayout_assignsIncrementalIds() {
        Long id1 = layoutService.saveLayout(new SetupBuildDTO());
        Long id2 = layoutService.saveLayout(new SetupBuildDTO());
        Long id3 = layoutService.saveLayout(new SetupBuildDTO());

        assertEquals(1L, id1);
        assertEquals(2L, id2);
        assertEquals(3L, id3);
        assertEquals(3, layoutService.getAllLayouts().size());
    }

    @Test
    void saveLayout_storesContentAndCreationTimestamp() {
        SetupBuildDTO payload = new SetupBuildDTO();

        Long id = layoutService.saveLayout(payload);

        StoredLayout stored = layoutService.getLayoutById(id);
        assertNotNull(stored);
        assertSame(payload, stored.getContent());
        assertNotNull(stored.getCreatedAt());
    }

    @Test
    void getAllLayouts_isEmptyInitially() {
        assertTrue(layoutService.getAllLayouts().isEmpty());
    }

    @Test
    void getLayoutById_returnsNullWhenMissing() {
        assertNull(layoutService.getLayoutById(999L));
    }

    @Test
    void getLayoutById_returnsMatchingEntry() {
        Long id = layoutService.saveLayout(new SetupBuildDTO());

        StoredLayout found = layoutService.getLayoutById(id);

        assertNotNull(found);
        assertEquals(id, found.getId());
    }
}
