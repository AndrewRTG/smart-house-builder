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

        if (build.getDevices() == null) {
            return new ValidationResult(true, "INFO", "Toate dispozitivele sunt compatibile.");
        }

        for (PlacedDevice pd : build.getDevices()) {
            if (pd == null || pd.getDevice() == null) {
                continue;
            }
            String deviceEco = pd.getDevice().getEcosystem();
            if (deviceEco == null || !target.equalsIgnoreCase(deviceEco.trim())) {
                String deviceName = pd.getDevice().getName() == null ? "necunoscut" : pd.getDevice().getName();
                return new ValidationResult(false, "ERROR",
                        "Dispozitivul '" + deviceName + "' nu este compatibil cu " + target);
            }
        }
        return new ValidationResult(true, "INFO", "Toate dispozitivele sunt compatibile.");
    }
}
