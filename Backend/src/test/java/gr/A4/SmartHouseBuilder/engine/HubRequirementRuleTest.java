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
        // Acoperă ramura: build == null
        ValidationResult result = rule.validate(null);
        assertTrue(result.isValid());
        assertEquals("INFO", result.getLevel());
    }

    @Test
    void testValidate_NullDevices() {
        // Acoperă ramura: build.getDevices() == null
        SetupBuild build = new SetupBuild();
        build.setDevices(null);
        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
    }

    @Test
    void testValidate_MissingHubForZigbee() {
        // Acoperă: are Zigbee dar lipsește Hub (needsHub = true, hasHub = false)
        SetupBuild build = new SetupBuild();

        Device zigbeeDev = new Device();
        zigbeeDev.setName("Senzor");
        zigbeeDev.setProtocol("Zigbee"); // S-a corectat în setProtocol conform model
        zigbeeDev.setDeviceType("SENSOR"); // S-a corectat în setDeviceType conform model

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
        // Acoperă: are Zigbee ȘI are Hub (needsHub = true, hasHub = true)
        SetupBuild build = new SetupBuild();

        Device zigbeeDev = new Device();
        zigbeeDev.setProtocol("z-wave"); // Testăm și varianta z-wave

        Device hubDev = new Device();
        hubDev.setDeviceType("Smart Hub"); // Conține "hub", deci hasHub devine true

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
        // Acoperă ramurile de 'continue' pentru elemente nule
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
        // Acoperă cazul în care nu avem nici Zigbee nici Hub (ambele false)
        SetupBuild build = new SetupBuild();
        Device wifiDev = new Device();
        wifiDev.setProtocol("Wifi");
        wifiDev.setDeviceType("Light");

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(wifiDev);
        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
    }
}