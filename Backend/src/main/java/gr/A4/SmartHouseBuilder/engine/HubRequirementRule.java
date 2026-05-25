package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;

public class HubRequirementRule implements IValidationRule {
    @Override
    public ValidationResult validate(SetupBuild build) {
        boolean hasHub = false;
        boolean needsHub = false;

        if (build == null || build.getDevices() == null) {
            return new ValidationResult(true, "INFO", "Cerințe Hub îndeplinite.");
        }

        for (PlacedDevice pd : build.getDevices()) {
            if (pd == null || pd.getDevice() == null) {
                continue;
            }

            String proto = pd.getDevice().getProtocol();
            String type = pd.getDevice().getDeviceType();
            String name = pd.getDevice().getName().toLowerCase();

            if ((type != null && type.toLowerCase().contains("hub"))||name.contains("hub")) {
                hasHub = true;
            }

            if (proto != null && (proto.toLowerCase().contains("zigbee") || proto.toLowerCase().contains("z-wave"))) {
                needsHub = true;
            }
        }

        if (needsHub && !hasHub) {
            return new ValidationResult(false, "ERROR", "Ai dispozitive Zigbee/Z-Wave dar lipsește un Hub.");
        }
        return new ValidationResult(true, "INFO", "Cerințe Hub îndeplinite.");
    }
}
