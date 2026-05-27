package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.engine.CompatibilityEngine;
import gr.A4.SmartHouseBuilder.engine.PhysicalDiscrepancyEngine;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.util.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class LayoutService {
    private final List<StoredLayout> db = new ArrayList<>();
    private final CompatibilityEngine compatibilityEngine;
    private final ModelMapper modelMapper;

    private final PhysicalDiscrepancyEngine physicalDiscrepancyEngine = new PhysicalDiscrepancyEngine();

    public LayoutService(CompatibilityEngine compatibilityEngine, ModelMapper modelMapper) {
        this.compatibilityEngine = compatibilityEngine;
        this.modelMapper = modelMapper;
    }

    public SetupBuildDTO validateLayout(StoredLayout layout) {
        SetupBuildDTO dto = layout.getContent();

        var engineModel = modelMapper.toEngineModel(dto);
        List<ValidationResult> results = compatibilityEngine.runAllChecks(engineModel);
        results.addAll(physicalDiscrepancyEngine.runAllChecks(engineModel));

        dto.setErrors(results);
        return dto;
    }

    public Long saveLayout(SetupBuildDTO dto) {
        StoredLayout sl = new StoredLayout();
        sl.setId((long) (db.size() + 1));
        sl.setCreatedAt(Instant.now());
        sl.setContent(dto);
        db.add(sl);
        return sl.getId();
    }

    public List<StoredLayout> getAllLayouts() {
        return db;
    }

    public StoredLayout getLayoutById(Long id) {
        return db.stream().filter(l -> l.getId().equals(id)).findFirst().orElse(null);
    }
}
