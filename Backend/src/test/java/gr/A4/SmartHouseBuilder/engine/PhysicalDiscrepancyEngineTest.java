package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PhysicalDiscrepancyEngineTest {

    private PhysicalDiscrepancyEngine engine;

    @BeforeEach
    void setUp() {
        engine = new PhysicalDiscrepancyEngine();
    }

    @Test
    void runAllChecks_withNullBuild_returnsEmptyList() {
        List<ValidationResult> results = engine.runAllChecks(null);
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void runAllChecks_withNullRooms_returnsEmptyList() {
        SetupBuild build = new SetupBuild();
        build.setRooms(null);
        build.setDevices(new ArrayList<>());

        List<ValidationResult> results = engine.runAllChecks(build);
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void runAllChecks_withNullDevices_returnsEmptyList() {
        SetupBuild build = new SetupBuild();
        build.setRooms(new ArrayList<>());
        build.setDevices(null);

        List<ValidationResult> results = engine.runAllChecks(build);
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void checkDevicesInRooms_deviceOutsideRoom_returnsError() {
        SetupBuild build = createBasicSetup();

        // Cameră 0-10, 0-10
        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        // Dispozitiv în afara camerei
        PlacedDevice device = createPlacedDevice("Lamp", "Light", 15.0, 15.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("nu se află în nicio cameră")
        ));
    }

    @Test
    void checkDevicesInRooms_deviceInsideRoom_noError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        PlacedDevice device = createPlacedDevice("Lamp", "Light", 5.0, 5.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        // Nu ar trebui să existe erori despre dispozitiv în afara camerei
        assertFalse(results.stream().anyMatch(r ->
            !r.isValid() && r.getMessage().contains("nu se află în nicio cameră")
        ));
    }

    @Test
    void checkDevicesOnDoorsWindows_nonLockOnDoor_returnsError() {
        SetupBuild build = createBasicSetup();

        Room room = new Room();
        room.setId("Bedroom");
        room.setSquareMeters(20.0);

        // Ușă pe poziția (5,0) -> (5,2)
        Segment2D door = createSegment(5.0, 0.0, 5.0, 2.0);
        room.setDoors(List.of(door));
        room.setWalls(createRectangleWalls(0, 0, 10, 10));
        build.setRooms(List.of(room));

        // Dispozitiv care NU e lock pe ușă
        PlacedDevice device = createPlacedDevice("Sensor", "Motion Sensor", 5.0, 0.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("plasat pe o ușă")
        ));
    }

    @Test
    void checkDevicesOnDoorsWindows_lockOnDoor_noError() {
        SetupBuild build = createBasicSetup();

        Room room = new Room();
        room.setId("Bedroom");
        room.setSquareMeters(20.0);

        Segment2D door = createSegment(5.0, 0.0, 5.0, 2.0);
        room.setDoors(List.of(door));
        room.setWalls(createRectangleWalls(0, 0, 10, 10));
        build.setRooms(List.of(room));

        // Lock pe ușă - OK
        PlacedDevice device = createPlacedDevice("Smart Lock", "Door Lock", 5.0, 0.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            !r.isValid() && r.getMessage().contains("plasat pe o ușă")
        ));
    }

    @Test
    void checkDevicesOnDoorsWindows_nonLockOnWindow_returnsError() {
        SetupBuild build = createBasicSetup();

        Room room = new Room();
        room.setId("Bedroom");
        room.setSquareMeters(20.0);

        Segment2D window = createSegment(0.0, 5.0, 0.0, 7.0);
        room.setWindows(List.of(window));
        room.setWalls(createRectangleWalls(0, 0, 10, 10));
        build.setRooms(List.of(room));

        PlacedDevice device = createPlacedDevice("Camera", "Security Camera", 0.0, 6.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("plasat pe o fereastră")
        ));
    }

    @Test
    void checkLightCoverage_insufficientLights_returnsWarning() {
        SetupBuild build = createBasicSetup();

        // Cameră de 100 mp - necesită ~2 becuri (50mp/bec)
        Room room = new Room();
        room.setId("Large Room");
        room.setSquareMeters(100.0);
        room.setWalls(createRectangleWalls(0, 0, 20, 20));
        build.setRooms(List.of(room));

        // Doar 1 bec
        PlacedDevice light = createPlacedDevice("Bulb", "Light", 10.0, 10.0);
        build.setDevices(List.of(light));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("WARNING") &&
            r.getMessage().contains("necesită cel puțin")
        ));
    }

    @Test
    void checkLightCoverage_sufficientLights_noWarning() {
        SetupBuild build = createBasicSetup();

        Room room = new Room();
        room.setId("Small Room");
        room.setSquareMeters(40.0);
        room.setWalls(createRectangleWalls(0, 0, 10, 10));
        build.setRooms(List.of(room));

        // 1 bec pentru 40mp este suficient
        PlacedDevice light = createPlacedDevice("Bulb", "Light", 5.0, 5.0);
        build.setDevices(List.of(light));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            r.getMessage().contains("necesită cel puțin")
        ));
    }

    @Test
    void checkLightCoverage_lightNameContainsBec_noWarning() {
        SetupBuild build = createBasicSetup();

        Room room = new Room();
        room.setId("Small Room");
        room.setSquareMeters(40.0);
        room.setWalls(createRectangleWalls(0, 0, 10, 10));
        build.setRooms(List.of(room));

        PlacedDevice light = createPlacedDevice("Bec dormitor", "Switch", 5.0, 5.0);
        build.setDevices(List.of(light));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            r.getMessage().contains("necesită cel puțin")
        ));
    }

    @Test
    void checkHubRange_deviceOutOfRange_returnsError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 30, 30);
        build.setRooms(List.of(room));

        // Hub la (0,0)
        PlacedDevice hub = createPlacedDevice("Smart Hub", "Hub", 0.0, 0.0);

        // Dispozitiv la (20, 20) - distanța este ~28.3m > 15m
        PlacedDevice device = createPlacedDevice("Light", "Light", 20.0, 20.0);

        build.setDevices(List.of(hub, device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("peste raza")
        ));
    }

    @Test
    void checkHubRange_deviceInRange_noError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 20, 20);
        build.setRooms(List.of(room));

        PlacedDevice hub = createPlacedDevice("Smart Hub", "Hub", 5.0, 5.0);
        PlacedDevice device = createPlacedDevice("Light", "Light", 10.0, 10.0);

        build.setDevices(List.of(hub, device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            !r.isValid() && r.getMessage().contains("peste raza")
        ));
    }

    @Test
    void checkHubRange_noHub_noError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 20, 20);
        build.setRooms(List.of(room));

        PlacedDevice device = createPlacedDevice("Light", "Light", 10.0, 10.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            r.getMessage().contains("peste raza")
        ));
    }

    @Test
    void checkDeviceOverlaps_twoDevicesTooClose_returnsError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        // Două dispozitive mari la aceeași poziție
        PlacedDevice device1 = createPlacedDevice("Table", "Furniture", 5.0, 5.0);
        PlacedDevice device2 = createPlacedDevice("Chair", "Furniture", 5.1, 5.1);

        build.setDevices(List.of(device1, device2));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("sunt prea aproape")
        ));
    }

    @Test
    void checkDeviceOverlaps_lightOverFurniture_noError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        // Bec peste masă - permis
        PlacedDevice furniture = createPlacedDevice("Table", "Furniture", 5.0, 5.0);
        PlacedDevice light = createPlacedDevice("Bulb", "Light", 5.0, 5.0);

        build.setDevices(List.of(furniture, light));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            !r.isValid() && r.getMessage().contains("sunt prea aproape")
        ));
    }

    @Test
    void checkDeviceOverlaps_twoLightsTooClose_returnsError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        // Două becuri prea aproape - nu e logic
        PlacedDevice light1 = createPlacedDevice("Bulb1", "Light", 5.0, 5.0);
        PlacedDevice light2 = createPlacedDevice("Bulb2", "Light", 5.2, 5.2);

        build.setDevices(List.of(light1, light2));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("sunt prea aproape")
        ));
    }

    @Test
    void checkDeviceOverlaps_devicesFarApart_noError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        PlacedDevice device1 = createPlacedDevice("Device1", "Furniture", 2.0, 2.0);
        PlacedDevice device2 = createPlacedDevice("Device2", "Furniture", 8.0, 8.0);

        build.setDevices(List.of(device1, device2));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            !r.isValid() && r.getMessage().contains("sunt prea aproape")
        ));
    }

    @Test
    void checkDeviceOverlaps_scaleCm_devicesAtFiftyCentimeters_noError() {
        SetupBuild build = createBasicSetup();
        build.setScale("cm");

        Room room = createRoom("Living Room", 0, 0, 100, 100);
        build.setRooms(List.of(room));

        PlacedDevice device1 = createPlacedDevice("Device1", "Furniture", 10.0, 10.0);
        PlacedDevice device2 = createPlacedDevice("Device2", "Furniture", 60.0, 10.0);

        build.setDevices(List.of(device1, device2));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            !r.isValid() && r.getMessage().contains("sunt prea aproape")
        ));
    }

    @Test
    void checkDeviceOverlaps_scaleCm_devicesUnderFiftyCentimeters_returnsError() {
        SetupBuild build = createBasicSetup();
        build.setScale("cm");

        Room room = createRoom("Living Room", 0, 0, 100, 100);
        build.setRooms(List.of(room));

        PlacedDevice device1 = createPlacedDevice("Device1", "Furniture", 10.0, 10.0);
        PlacedDevice device2 = createPlacedDevice("Device2", "Furniture", 59.0, 10.0);

        build.setDevices(List.of(device1, device2));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("sunt prea aproape")
        ));
    }

    @Test
    void checkDeviceOverlaps_withNullCoordinates_noError() {
        SetupBuild build = createBasicSetup();

        Room room = createRoom("Living Room", 0, 0, 10, 10);
        build.setRooms(List.of(room));

        PlacedDevice device1 = createPlacedDevice("Device1", "Furniture", null, null);
        PlacedDevice device2 = createPlacedDevice("Device2", "Furniture", 5.0, 5.0);

        build.setDevices(List.of(device1, device2));

        List<ValidationResult> results = engine.runAllChecks(build);

        // Nu ar trebui să genereze excepții
        assertNotNull(results);
    }

    @Test
    void checkHubRange_gridScaleUsesHalfMeterPerPoint() {
        SetupBuild build = createBasicSetup();
        build.setScale("grid");

        Room room = createRoom("Long Room", 0, 0, 40, 10);
        build.setRooms(List.of(room));

        PlacedDevice hub = createPlacedDevice("Gateway", "Controller", 0.0, 0.0);
        PlacedDevice deviceInRange = createPlacedDevice("Sensor", "Motion Sensor", 30.0, 0.0);
        PlacedDevice deviceOutOfRange = createPlacedDevice("Camera", "Security Camera", 31.0, 0.0);

        build.setDevices(List.of(hub, deviceInRange, deviceOutOfRange));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertFalse(results.stream().anyMatch(r ->
            r.getMessage().contains("Sensor") && r.getMessage().contains("peste raza")
        ));
        assertTrue(results.stream().anyMatch(r ->
            r.getMessage().contains("Camera") && r.getMessage().contains("peste raza")
        ));
    }

    @Test
    void checkDevicesOnDoorsWindows_zeroLengthDoorStillDetectsNonLockDevice() {
        SetupBuild build = createBasicSetup();

        Room room = new Room();
        room.setId("Entry");
        room.setSquareMeters(16.0);
        room.setWalls(createRectangleWalls(0, 0, 4, 4));
        room.setDoors(List.of(createSegment(2.0, 0.0, 2.0, 0.0)));
        build.setRooms(List.of(room));

        PlacedDevice device = createPlacedDevice("Door Camera", "Security Camera", 2.0, 0.0);
        build.setDevices(List.of(device));

        List<ValidationResult> results = engine.runAllChecks(build);

        assertTrue(results.stream().anyMatch(r ->
            !r.isValid() &&
            r.getLevel().equals("ERROR") &&
            r.getMessage().contains("plasat pe o u")
        ));
    }

    // Helper methods

    private SetupBuild createBasicSetup() {
        SetupBuild build = new SetupBuild();
        build.setId("test-build");
        build.setRooms(new ArrayList<>());
        build.setDevices(new ArrayList<>());
        return build;
    }

    private Room createRoom(String id, double x1, double y1, double x2, double y2) {
        Room room = new Room();
        room.setId(id);
        room.setSquareMeters((x2 - x1) * (y2 - y1));
        room.setWalls(createRectangleWalls(x1, y1, x2, y2));
        room.setDoors(new ArrayList<>());
        room.setWindows(new ArrayList<>());
        room.setPlugs(new ArrayList<>());
        return room;
    }

    private List<Segment2D> createRectangleWalls(double x1, double y1, double x2, double y2) {
        List<Segment2D> walls = new ArrayList<>();
        walls.add(createSegment(x1, y1, x2, y1)); // bottom
        walls.add(createSegment(x2, y1, x2, y2)); // right
        walls.add(createSegment(x2, y2, x1, y2)); // top
        walls.add(createSegment(x1, y2, x1, y1)); // left
        return walls;
    }

    private Segment2D createSegment(double x1, double y1, double x2, double y2) {
        Segment2D seg = new Segment2D();
        seg.setX1(x1);
        seg.setY1(y1);
        seg.setX2(x2);
        seg.setY2(y2);
        return seg;
    }

    private PlacedDevice createPlacedDevice(String name, String type, Double x, Double y) {
        Device device = new Device();
        device.setName(name);
        device.setDeviceType(type);

        PlacedDevice pd = new PlacedDevice();
        pd.setDevice(device);
        pd.setX(x);
        pd.setY(y);
        return pd;
    }
}
