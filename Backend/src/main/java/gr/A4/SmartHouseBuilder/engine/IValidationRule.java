package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

public interface IValidationRule {
    ValidationResult validate(SetupBuild build);
}
