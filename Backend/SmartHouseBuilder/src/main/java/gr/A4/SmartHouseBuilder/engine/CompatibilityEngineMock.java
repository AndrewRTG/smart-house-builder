package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CompatibilityEngineMock {
    public List<ValidationResult> runAllChecks(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();
        results.add(new ValidationResult(true, "INFO", "Machetă: Bugetul de " + build.getMaxBudget() + " a fost acceptat."));
        return results;
    }
}
