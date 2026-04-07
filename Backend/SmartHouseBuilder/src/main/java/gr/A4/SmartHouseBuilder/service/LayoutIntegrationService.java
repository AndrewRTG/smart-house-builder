package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.engine.CompatibilityEngine;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@AllArgsConstructor
@Service
public class LayoutIntegrationService {

    private final CompatibilityEngine compatibilityEngine;

    // Metoda asta e cheia! Primeste DTO (de la ei) si il face Model (pentru tine)
    public List<ValidationResult> verifyTeam2Layout(SetupBuildDTO dto) {
        SetupBuild build = new SetupBuild();
        build.setId(dto.getId());
        build.setMaxBudget(dto.getMaxBudget());
        build.setTargetEcosystem(dto.getTargetEcosystem());
        // Aici am pus doar campurile de baza. Daca ai nevoie de camere/dispozitive, le adaugam ulterior.

        return compatibilityEngine.runAllChecks(build);
    }
}