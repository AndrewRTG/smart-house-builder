package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HubRequirementRuleTest {

    private HubRequirementRule rule;

    @BeforeEach
    void setUp() {
        rule = new HubRequirementRule();
    }

    @Test
    void testValidate_NullBuild() {
        ValidationResult result = rule.validate(null);
        assertTrue(result.isValid());
        assertEquals("INFO", result.getLevel());
    }

    @Test
    void testValidate_NullDevices() {
        SetupBuild build = new SetupBuild();
        build.setDevices(null);
        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
    }

    @Test
    void testValidate_MissingHubForZigbee() {
        SetupBuild build = new SetupBuild();

        Device zigbeeDev = new Device();
        zigbeeDev.setName("Senzor Zigbee");
        zigbeeDev.setProtocol("Zigbee");
        zigbeeDev.setDeviceType("SENSOR");

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(zigbeeDev);
        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);
        assertFalse(result.isValid());
        assertEquals("ERROR", result.getLevel());
        assertTrue(result.getMessage().contains("lipsește un Hub"));
    }

    @Test
    void testValidate_WithHubPresent() {
        SetupBuild build = new SetupBuild();

        Device zigbeeDev = new Device();
        zigbeeDev.setName("Senzor Z-Wave");
        zigbeeDev.setProtocol("z-wave");

        Device hubDev = new HubDevPlaceholder();
        hubDev.setName("Main Hub");
        hubDev.setDeviceType("Smart Hub");

        PlacedDevice pd1 = new PlacedDevice();
        pd1.setDevice(zigbeeDev);

        PlacedDevice pd2 = new PlacedDevice();
        pd2.setDevice(hubDev);

        build.setDevices(List.of(pd1, pd2));

        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
        assertEquals("Cerințe Hub îndeplinite.", result.getMessage());
    }

    @Test
    void testValidate_ContinueBranches() {
        SetupBuild build = new SetupBuild();
        List<PlacedDevice> devices = new ArrayList<>();
        devices.add(null);

        PlacedDevice pdNoDev = new PlacedDevice();
        pdNoDev.setDevice(null);
        devices.add(pdNoDev);

        build.setDevices(devices);

        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
    }

    @Test
    void testValidate_NoZigbeeNoHub() {
        SetupBuild build = new SetupBuild();
        Device wifiDev = new Device();
        wifiDev.setName("Lumina Wifi");
        wifiDev.setProtocol("Wifi");
        wifiDev.setDeviceType("Light");

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(wifiDev);
        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
    }

    private static class HubDevPlaceholder extends Device {}
}