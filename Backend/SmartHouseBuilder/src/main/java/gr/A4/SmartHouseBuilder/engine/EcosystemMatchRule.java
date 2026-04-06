package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

public class EcosystemMatchRule implements IValidationRule {

    @Override
    public ValidationResult validate(SetupBuild build) {
        if (build == null) {
            return new ValidationResult(false, "ERROR", "SetupBuild este null.");
        }

        if (build.getTargetEcosystem() == null || build.getTargetEcosystem().isBlank()) {
            return new ValidationResult(false, "ERROR", "Ecosistemul țintă lipsește.");
        }

        if (build.getDevices() == null || build.getDevices().isEmpty()) {
            return new ValidationResult(true, "INFO", "Nu există device-uri de verificat.");
        }

        String target = build.getTargetEcosystem().trim();

        for (PlacedDevice placedDevice : build.getDevices()) {
            if (placedDevice == null || placedDevice.getDevice() == null) {
                return new ValidationResult(false, "ERROR", "Există un device invalid în listă.");
            }

            String ecosystem = placedDevice.getDevice().getEcosystem();
            if (ecosystem == null || !target.equalsIgnoreCase(ecosystem.trim())) {
                String deviceName = placedDevice.getDevice().getName();

                return new ValidationResult(false, "ERROR", "Device-ul '" + deviceName + "' nu este compatibil cu ecosistemul țintă '" + target + "'.");
            }
        }

        return new ValidationResult(true, "INFO", "Toate device-urile sunt compatibile cu ecosistemul țintă.");
    }
}
