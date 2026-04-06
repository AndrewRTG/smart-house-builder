package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

public class HubRequirementRule implements IValidationRule {

    @Override
    public ValidationResult validate(SetupBuild build) {
        if (build == null) {
            return new ValidationResult(false, "ERROR", "SetupBuild este null.");
        }

        if (build.getDevices() == null || build.getDevices().isEmpty()) {
            return new ValidationResult(true, "INFO", "Nu există device-uri de verificat.");
        }

        boolean hasHub = false;
        boolean requiresHub = false;

        for (PlacedDevice placedDevice : build.getDevices()) {
            if (placedDevice == null || placedDevice.getDevice() == null) {
                continue;
            }

            String name = placedDevice.getDevice().getName();
            String deviceType = placedDevice.getDevice().getDeviceType();

            if ((name != null && name.toLowerCase().contains("hub")) ||
                (deviceType != null && deviceType.toLowerCase().contains("hub"))) {
                hasHub = true;
            }

            // Heuristică simplă: anumite device-uri pot avea nevoie de hub
            String protocol = placedDevice.getDevice().getProtocol();
            if (protocol != null) {
                String normalized = protocol.toLowerCase();
                if (normalized.contains("zigbee") || normalized.contains("zwave") || normalized.contains("z-wave")) {
                    requiresHub = true;
                }
            }
        }

        if (requiresHub && !hasHub) {
            return new ValidationResult(false, "ERROR", "Există device-uri care necesită hub, dar nu a fost găsit niciun hub în setup.");
        }

        return new ValidationResult(true, "INFO", "Cerința de hub este îndeplinită.");
    }
}
