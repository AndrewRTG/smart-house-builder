package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

public class EcosystemMatchRule implements IValidationRule {

    @Override
    public ValidationResult validate(SetupBuild build) {
        if (build == null) {
            return new ValidationResult(false, "ERROR", "SetupBuild is null.");
        }

        if (build.getTargetEcosystem() == null || build.getTargetEcosystem().isBlank()) {
            return new ValidationResult(false, "ERROR", "Target Ecosystem is missing.");
        }

        if (build.getDevices() == null || build.getDevices().isEmpty()) {
            return new ValidationResult(true, "INFO", "There are no devices to check.");
        }

        String target = build.getTargetEcosystem().trim();

        for (PlacedDevice placedDevice : build.getDevices()) {
            if (placedDevice == null || placedDevice.getDevice() == null) {
                return new ValidationResult(false, "ERROR", "Invalid device given.");
            }

            String ecosystem = placedDevice.getDevice().getEcosystem();
            if (ecosystem == null || !target.equalsIgnoreCase(ecosystem.trim())) {
                String deviceName = placedDevice.getDevice().getName();

                return new ValidationResult(false, "ERROR", "'" + deviceName + "' is not compatible with '" + target + "' ecosystem.");
            }
        }

        return new ValidationResult(true, "INFO", "All devices are compatible with given ecosystem.");
    }
}
