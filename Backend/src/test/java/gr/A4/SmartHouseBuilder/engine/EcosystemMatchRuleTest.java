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

class EcosystemMatchRuleTest {

    private EcosystemMatchRule rule;

    @BeforeEach
    void setUp() {
        rule = new EcosystemMatchRule();
    }

    @Test
    void testValidate_NullBuildOrEcosystem() {
        // Testăm ramura build == null
        ValidationResult result1 = rule.validate(null);
        assertFalse(result1.isValid());
        assertEquals("ERROR", result1.getLevel());

        // Testăm ramura targetEcosystem == null
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem(null);
        ValidationResult result2 = rule.validate(build);
        assertFalse(result2.isValid());
    }
    @Test
    void testValidate_DevicesListIsNull() {
        // 1. Pregătim un build unde lista de dispozitive este NULL (Ramura TRUE)
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Alexa");
        build.setDevices(null); // Forțăm valoarea null

        // 2. Executăm validarea
        ValidationResult result = rule.validate(build);

        // 3. Verificăm rezultatul (trebuie să returneze succesul definit în acel IF)
        assertTrue(result.isValid());
        assertEquals("INFO", result.getLevel());
        assertEquals("Toate dispozitivele sunt compatibile.", result.getMessage());
    }

    @Test
    void testValidate_DevicesListIsNotNull() {
        // 1. Pregătim un build unde lista de dispozitive NU este null (Ramura FALSE)
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Alexa");

        // Cream o listă goală (dar care nu este null)
        build.setDevices(new ArrayList<>());

        // 2. Executăm validarea
        ValidationResult result = rule.validate(build);

        // 3. Verificăm că a trecut de acel IF și a ajuns la finalul metodei
        // (Pentru o listă goală, bucla for nu se execută și returnează tot succesul de la final)
        assertTrue(result.isValid());
        assertEquals("Toate dispozitivele sunt compatibile.", result.getMessage());
    }

    @Test
    void testValidate_SuccessAllMatch() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Google Home");

        // Folosim clasa Device (sau o instanță de HardwareDevice cast-uită la Device)
        // deoarece PlacedDevice.setDevice() acceptă tipul Device
        Device dev = new Device();
        dev.setName("Bec Smart");
        dev.setEcosystem("Google Home");

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(dev);

        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);
        assertTrue(result.isValid());
        assertEquals("INFO", result.getLevel());
    }

    @Test
    void testValidate_IncompatibleDevice() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Alexa");

        Device dev = new Device();
        dev.setName("Senzor Miscare");
        dev.setEcosystem("Google Home"); // Mismatch intenționat

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(dev);

        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);

        assertFalse(result.isValid());
        assertEquals("ERROR", result.getLevel());
        assertTrue(result.getMessage().contains("Senzor Miscare"));
        assertTrue(result.getMessage().contains("nu este compatibil cu Alexa"));
    }

    @Test
    void testValidate_NullAndContinueBranches() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Zigbee");

        List<PlacedDevice> devices = new ArrayList<>();

        // Ramura: pd == null -> continue
        devices.add(null);

        // Ramura: pd.getDevice() == null -> continue
        PlacedDevice pdEmpty = new PlacedDevice();
        pdEmpty.setDevice(null);
        devices.add(pdEmpty);

        build.setDevices(devices);

        ValidationResult result = rule.validate(build);

        // Dacă toate dau continue, ajunge la finalul metodei cu succes
        assertTrue(result.isValid());
        assertEquals("Toate dispozitivele sunt compatibile.", result.getMessage());
    }

    @Test
    void testValidate_DeviceEcoNullAndNameNull() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Matter");

        Device dev = new Device();
        dev.setName(null);      // Testăm ramura name == null -> "necunoscut"
        dev.setEcosystem(null); // Testăm ramura deviceEco == null -> ERROR

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(dev);
        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);

        assertFalse(result.isValid());
        assertTrue(result.getMessage().contains("necunoscut"));
    }
}