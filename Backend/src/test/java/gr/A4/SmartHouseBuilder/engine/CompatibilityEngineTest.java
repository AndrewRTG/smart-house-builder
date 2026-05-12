package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CompatibilityEngineTest {

    private final CompatibilityEngine compatibilityEngine = new CompatibilityEngine();

    @Test
    void runAllChecks_returnsEmptyListForNullBuild() {
        assertThat(compatibilityEngine.runAllChecks(null)).isEmpty();
    }

    @Test
    void runAllChecks_returnsResultsForAllRules() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Google Home");
        build.setDevices(List.of(placedDevice("Hub", "hub", "wifi", "Google Home")));

        var results = compatibilityEngine.runAllChecks(build);

        assertThat(results).hasSize(2);
        assertThat(results).extracting("valid").containsExactly(true, true);
    }

    private PlacedDevice placedDevice(String name, String type, String protocol, String ecosystem) {
        Device device = new Device();
        device.setName(name);
        device.setDeviceType(type);
        device.setProtocol(protocol);
        device.setEcosystem(ecosystem);

        PlacedDevice placedDevice = new PlacedDevice();
        placedDevice.setDevice(device);
        return placedDevice;
    }
}
