package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class HubRequirementRuleTest {

    private final HubRequirementRule rule = new HubRequirementRule();

    @Test
    void validate_acceptsNullBuildOrDevices() {
        assertThat(rule.validate(null).isValid()).isTrue();

        SetupBuild build = new SetupBuild();
        assertThat(rule.validate(build).isValid()).isTrue();
    }

    @Test
    void validate_rejectsZigbeeDevicesWithoutHub() {
        SetupBuild build = new SetupBuild();
        build.setDevices(List.of(placedDevice("Sensor", "sensor", "Zigbee")));

        var result = rule.validate(build);

        assertThat(result.isValid()).isFalse();
        assertThat(result.getMessage()).contains("Hub");
    }

    @Test
    void validate_acceptsHubWhenRequired() {
        SetupBuild build = new SetupBuild();
        build.setDevices(List.of(
                placedDevice("Main Hub", "smart hub", "WiFi"),
                placedDevice("Door Sensor", "sensor", "Z-Wave")
        ));

        var result = rule.validate(build);

        assertThat(result.isValid()).isTrue();
    }

    @Test
    void validate_ignoresNullEntriesAndUnrelatedProtocols() {
        SetupBuild build = new SetupBuild();
        List<PlacedDevice> devices = new ArrayList<>();
        devices.add(null);
        devices.add(new PlacedDevice());
        devices.add(placedDevice("Lamp", "light", "WiFi"));
        build.setDevices(devices);

        var result = rule.validate(build);

        assertThat(result.isValid()).isTrue();
    }

    private PlacedDevice placedDevice(String name, String type, String protocol) {
        Device device = new Device();
        device.setName(name);
        device.setDeviceType(type);
        device.setProtocol(protocol);

        PlacedDevice placedDevice = new PlacedDevice();
        placedDevice.setDevice(device);
        return placedDevice;
    }
}
