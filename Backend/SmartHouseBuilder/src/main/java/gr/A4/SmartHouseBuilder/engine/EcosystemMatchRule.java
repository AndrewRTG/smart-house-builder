package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

public class EcosystemMatchRule implements IValidationRule {
    @Override
    public ValidationResult validate(SetupBuild build) {
        if (build == null || build.getTargetEcosystem() == null) {
            return new ValidationResult(false, "ERROR", "Date incomplete pentru ecosistem.");
        }

        String target = build.getTargetEcosystem().trim();

        for (PlacedDevice pd : build.getDevices()) {
            String deviceEco = pd.getDevice().getEcosystem();
            if (deviceEco == null || !target.equalsIgnoreCase(deviceEco.trim())) {
                return new ValidationResult(false, "ERROR", 
                    "Dispozitivul '" + pd.getDevice().getName() + "' nu este compatibil cu " + target);
            }
        }
        return new ValidationResult(true, "INFO", "Toate dispozitivele sunt compatibile.");
    }
}