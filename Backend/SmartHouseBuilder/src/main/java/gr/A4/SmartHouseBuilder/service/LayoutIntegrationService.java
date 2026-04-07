package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.engine.CompatibilityEngineMock;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class LayoutIntegrationService {

    private final CompatibilityEngineMock compatibilityEngine;

    public List<ValidationResult> integrateAndVerify(SetupBuild build) {

        List<ValidationResult> finalResults = new ArrayList<>(compatibilityEngine.runAllChecks(build));

        return finalResults;
    }
}