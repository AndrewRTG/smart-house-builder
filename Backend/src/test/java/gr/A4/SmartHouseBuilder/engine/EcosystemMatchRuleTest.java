package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EcosystemMatchRuleTest {

    private final EcosystemMatchRule rule = new EcosystemMatchRule();

    @Test
    void validate_rejectsMissingTargetEcosystem() {
        var result = rule.validate(new SetupBuild());

        assertThat(result.isValid()).isFalse();
        assertThat(result.getMessage()).contains("Date incomplete");
    }

    @Test
    void validate_acceptsNullDeviceList() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Alexa");

        var result = rule.validate(build);

        assertThat(result.isValid()).isTrue();
    }

    @Test
    void validate_rejectsFirstIncompatibleDevice() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Matter");
        build.setDevices(List.of(
                placedDevice("Bridge", "Matter"),
                placedDevice("Camera", "Alexa")
        ));

        var result = rule.validate(build);

        assertThat(result.isValid()).isFalse();
        assertThat(result.getMessage()).contains("Camera").contains("Matter");
    }

    @Test
    void validate_acceptsCompatibleDevicesAndNullEntries() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Google Home");
        build.setDevices(List.of(
                null,
                placedDevice(null, "Google Home"),
                new PlacedDevice()
        ));

        var result = rule.validate(build);

        assertThat(result.isValid()).isTrue();
    }

    private PlacedDevice placedDevice(String name, String ecosystem) {
        Device device = new Device();
        device.setName(name);
        device.setEcosystem(ecosystem);

        PlacedDevice placedDevice = new PlacedDevice();
        placedDevice.setDevice(device);
        return placedDevice;
    }
}
