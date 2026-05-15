package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CompatibilityEngine {

    private final List<IValidationRule> rules = List.of(
            new EcosystemMatchRule(),
            new HubRequirementRule()
    );

    public List<ValidationResult> runAllChecks(SetupBuild build) {
        List<ValidationResult> results = new ArrayList<>();
        if (build == null) {
            return results;
        }

        for (IValidationRule rule : rules) {
            results.add(rule.validate(build));
        }
        return results;
    }
}
