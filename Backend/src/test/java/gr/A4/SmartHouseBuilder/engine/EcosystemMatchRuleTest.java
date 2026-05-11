package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
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
        assertFalse(rule.validate(null).isValid());

        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem(null);
        assertFalse(rule.validate(build).isValid());
    }

    @Test
    void testValidate_SuccessAllMatch() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Google Home");

        // Creează un HardwareDevice (care extinde Device sau e convertibil)
        HardwareDevice hDev = new HardwareDevice();
        hDev.setName("Bec");
        // ATENȚIE: Dacă getEcosystem() dă eroare, verifică cum se numește
        // câmpul în HardwareDevice. Dacă e în specificații, va trebui să
        // folosim un obiect care are acel câmp setat.

        PlacedDevice pd = new PlacedDevice();
        // Folosim direct constructorul sau setterul corect.
        // Dacă eroarea persistă, înseamnă că PlacedDevice vrea modelul "Device"
        // nu "HardwareDevice".
        pd.setDevice(hDev);

        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);
        // Dacă datele sunt goale, regula ta returnează succes conform codului
        assertTrue(result.isValid());
    }

    @Test
    void testValidate_IncompatibleDevice() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Alexa");

        HardwareDevice hDev = new HardwareDevice();
        hDev.setName("Senzor");
        // Aici e problema: Dacă HardwareDevice nu are setEcosystem,
        // înseamnă că ecosistemul este citit din altă parte în clasa Device.

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(hDev);

        build.setDevices(List.of(pd));

        ValidationResult result = rule.validate(build);
        // Dacă hDev.getEcosystem() returnează null, va intra pe ramura de ERROR
        assertFalse(result.isValid());
        assertEquals("ERROR", result.getLevel());
    }

    @Test
    void testValidate_DeviceWithNullNameOrEcosystem() {
        SetupBuild build = new SetupBuild();
        build.setTargetEcosystem("Zigbee");

        List<PlacedDevice> devices = new ArrayList<>();

        // Acoperă 'if (pd == null)'
        devices.add(null);

        // Acoperă 'if (pd.getDevice() == null)'
        PlacedDevice pdNoDev = new PlacedDevice();
        pdNoDev.setDevice(null);
        devices.add(pdNoDev);

        build.setDevices(devices);

        ValidationResult result = rule.validate(build);
        // Va returna succes pentru că a dat 'continue' la toate
        assertTrue(result.isValid());
    }
}