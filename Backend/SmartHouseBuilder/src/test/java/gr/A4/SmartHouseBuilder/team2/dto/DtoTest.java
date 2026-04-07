package gr.A4.SmartHouseBuilder.team2.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for all DTO classes introduced in this PR.
 * These classes use Lombok @Data (getters, setters, equals, hashCode, toString).
 */
class DtoTest {

    // ==== PointDTO ====

    @Test
    void pointDTO_gettersAndSetters() {
        PointDTO point = new PointDTO();
        point.setX(10.5);
        point.setY(20.3);

        assertThat(point.getX()).isEqualTo(10.5);
        assertThat(point.getY()).isEqualTo(20.3);
    }

    @Test
    void pointDTO_equality() {
        PointDTO p1 = new PointDTO();
        p1.setX(1.0);
        p1.setY(2.0);

        PointDTO p2 = new PointDTO();
        p2.setX(1.0);
        p2.setY(2.0);

        assertThat(p1).isEqualTo(p2);
        assertThat(p1.hashCode()).isEqualTo(p2.hashCode());
    }

    @Test
    void pointDTO_inequality_differentX() {
        PointDTO p1 = new PointDTO();
        p1.setX(1.0);
        p1.setY(2.0);

        PointDTO p2 = new PointDTO();
        p2.setX(9.0);
        p2.setY(2.0);

        assertThat(p1).isNotEqualTo(p2);
    }

    @Test
    void pointDTO_nullFieldsByDefault() {
        PointDTO point = new PointDTO();
        assertThat(point.getX()).isNull();
        assertThat(point.getY()).isNull();
    }

    // ==== WallDTO ====

    @Test
    void wallDTO_gettersAndSetters() {
        WallDTO wall = new WallDTO();
        wall.setX1(0.0);
        wall.setY1(0.0);
        wall.setX2(100.0);
        wall.setY2(0.0);

        assertThat(wall.getX1()).isEqualTo(0.0);
        assertThat(wall.getY1()).isEqualTo(0.0);
        assertThat(wall.getX2()).isEqualTo(100.0);
        assertThat(wall.getY2()).isEqualTo(0.0);
    }

    @Test
    void wallDTO_equality() {
        WallDTO w1 = new WallDTO();
        w1.setX1(1.0);
        w1.setY1(2.0);
        w1.setX2(3.0);
        w1.setY2(4.0);

        WallDTO w2 = new WallDTO();
        w2.setX1(1.0);
        w2.setY1(2.0);
        w2.setX2(3.0);
        w2.setY2(4.0);

        assertThat(w1).isEqualTo(w2);
    }

    @Test
    void wallDTO_inequality_differentEndpoint() {
        WallDTO w1 = new WallDTO();
        w1.setX1(0.0);
        w1.setY1(0.0);
        w1.setX2(100.0);
        w1.setY2(0.0);

        WallDTO w2 = new WallDTO();
        w2.setX1(0.0);
        w2.setY1(0.0);
        w2.setX2(200.0);
        w2.setY2(0.0);

        assertThat(w1).isNotEqualTo(w2);
    }

    // ==== WindowDTO ====

    @Test
    void windowDTO_gettersAndSetters() {
        WindowDTO window = new WindowDTO();
        window.setX(5.0);
        window.setY(10.0);
        window.setWidth(1.2);
        window.setHeight(1.5);
        window.setDistanceFromFloor(0.9);

        assertThat(window.getX()).isEqualTo(5.0);
        assertThat(window.getY()).isEqualTo(10.0);
        assertThat(window.getWidth()).isEqualTo(1.2);
        assertThat(window.getHeight()).isEqualTo(1.5);
        assertThat(window.getDistanceFromFloor()).isEqualTo(0.9);
    }

    @Test
    void windowDTO_equality() {
        WindowDTO w1 = new WindowDTO();
        w1.setX(1.0);
        w1.setY(2.0);
        w1.setWidth(3.0);
        w1.setHeight(4.0);
        w1.setDistanceFromFloor(0.5);

        WindowDTO w2 = new WindowDTO();
        w2.setX(1.0);
        w2.setY(2.0);
        w2.setWidth(3.0);
        w2.setHeight(4.0);
        w2.setDistanceFromFloor(0.5);

        assertThat(w1).isEqualTo(w2);
        assertThat(w1.hashCode()).isEqualTo(w2.hashCode());
    }

    @Test
    void windowDTO_nullFieldsByDefault() {
        WindowDTO window = new WindowDTO();
        assertThat(window.getX()).isNull();
        assertThat(window.getY()).isNull();
        assertThat(window.getWidth()).isNull();
        assertThat(window.getHeight()).isNull();
        assertThat(window.getDistanceFromFloor()).isNull();
    }

    // ==== DeviceDTO ====

    @Test
    void deviceDTO_gettersAndSetters() {
        DeviceDTO device = new DeviceDTO();
        device.setId("dev-1");
        device.setName("Smart Bulb");
        device.setPrice(29.99);
        device.setEcosystem("Zigbee");
        device.setProtocol("Z-Wave");
        device.setLumens(800);
        device.setRequiresPlug(false);
        device.setRangeRadius(15.0);
        device.setDeviceType("light");
        device.setMountType("ceiling");
        device.setFieldOfView(120.0);
        device.setPowerConsumption(9.0);
        device.setCommunicationFrequency("2.4GHz");
        device.setWidth(0.08);

        assertThat(device.getId()).isEqualTo("dev-1");
        assertThat(device.getName()).isEqualTo("Smart Bulb");
        assertThat(device.getPrice()).isEqualTo(29.99);
        assertThat(device.getEcosystem()).isEqualTo("Zigbee");
        assertThat(device.getProtocol()).isEqualTo("Z-Wave");
        assertThat(device.getLumens()).isEqualTo(800);
        assertThat(device.getRequiresPlug()).isFalse();
        assertThat(device.getRangeRadius()).isEqualTo(15.0);
        assertThat(device.getDeviceType()).isEqualTo("light");
        assertThat(device.getMountType()).isEqualTo("ceiling");
        assertThat(device.getFieldOfView()).isEqualTo(120.0);
        assertThat(device.getPowerConsumption()).isEqualTo(9.0);
        assertThat(device.getCommunicationFrequency()).isEqualTo("2.4GHz");
        assertThat(device.getWidth()).isEqualTo(0.08);
    }

    @Test
    void deviceDTO_equality() {
        DeviceDTO d1 = new DeviceDTO();
        d1.setId("dev-1");
        d1.setName("Sensor");

        DeviceDTO d2 = new DeviceDTO();
        d2.setId("dev-1");
        d2.setName("Sensor");

        assertThat(d1).isEqualTo(d2);
    }

    @Test
    void deviceDTO_inequality_differentId() {
        DeviceDTO d1 = new DeviceDTO();
        d1.setId("dev-1");

        DeviceDTO d2 = new DeviceDTO();
        d2.setId("dev-2");

        assertThat(d1).isNotEqualTo(d2);
    }

    @Test
    void deviceDTO_nullFieldsByDefault() {
        DeviceDTO device = new DeviceDTO();
        assertThat(device.getId()).isNull();
        assertThat(device.getName()).isNull();
        assertThat(device.getPrice()).isNull();
        assertThat(device.getLumens()).isNull();
        assertThat(device.getRequiresPlug()).isNull();
    }

    // ==== PlacedDeviceDTO ====

    @Test
    void placedDeviceDTO_gettersAndSetters() {
        PlacedDeviceDTO placed = new PlacedDeviceDTO();

        PointDTO coords = new PointDTO();
        coords.setX(5.0);
        coords.setY(10.0);

        DeviceDTO device = new DeviceDTO();
        device.setId("dev-99");

        placed.setCoordinates(coords);
        placed.setRotationAngle(45.0);
        placed.setDevice(device);

        assertThat(placed.getCoordinates()).isSameAs(coords);
        assertThat(placed.getRotationAngle()).isEqualTo(45.0);
        assertThat(placed.getDevice()).isSameAs(device);
    }

    @Test
    void placedDeviceDTO_equality() {
        PointDTO coords = new PointDTO();
        coords.setX(1.0);
        coords.setY(2.0);

        DeviceDTO device = new DeviceDTO();
        device.setId("d1");

        PlacedDeviceDTO p1 = new PlacedDeviceDTO();
        p1.setCoordinates(coords);
        p1.setRotationAngle(90.0);
        p1.setDevice(device);

        PlacedDeviceDTO p2 = new PlacedDeviceDTO();
        p2.setCoordinates(coords);
        p2.setRotationAngle(90.0);
        p2.setDevice(device);

        assertThat(p1).isEqualTo(p2);
    }

    @Test
    void placedDeviceDTO_nullFieldsByDefault() {
        PlacedDeviceDTO placed = new PlacedDeviceDTO();
        assertThat(placed.getCoordinates()).isNull();
        assertThat(placed.getRotationAngle()).isNull();
        assertThat(placed.getDevice()).isNull();
    }

    // ==== RoomDTO ====

    @Test
    void roomDTO_gettersAndSetters() {
        RoomDTO room = new RoomDTO();
        room.setId("room-1");
        room.setSquareMeters(25.0);
        room.setWallType("brick");

        WallDTO wall = new WallDTO();
        wall.setX1(0.0);
        wall.setY1(0.0);
        wall.setX2(5.0);
        wall.setY2(0.0);

        PointDTO door = new PointDTO();
        door.setX(2.5);
        door.setY(0.0);

        WindowDTO window = new WindowDTO();
        window.setX(1.0);
        window.setY(0.0);
        window.setWidth(1.2);
        window.setHeight(1.5);
        window.setDistanceFromFloor(0.9);

        PointDTO plug = new PointDTO();
        plug.setX(4.0);
        plug.setY(0.5);

        room.setWalls(List.of(wall));
        room.setDoors(List.of(door));
        room.setWindows(List.of(window));
        room.setPlugs(List.of(plug));

        assertThat(room.getId()).isEqualTo("room-1");
        assertThat(room.getSquareMeters()).isEqualTo(25.0);
        assertThat(room.getWallType()).isEqualTo("brick");
        assertThat(room.getWalls()).hasSize(1);
        assertThat(room.getDoors()).hasSize(1);
        assertThat(room.getWindows()).hasSize(1);
        assertThat(room.getPlugs()).hasSize(1);
    }

    @Test
    void roomDTO_nullCollectionsByDefault() {
        RoomDTO room = new RoomDTO();
        assertThat(room.getWalls()).isNull();
        assertThat(room.getDoors()).isNull();
        assertThat(room.getWindows()).isNull();
        assertThat(room.getPlugs()).isNull();
    }

    @Test
    void roomDTO_emptyCollections() {
        RoomDTO room = new RoomDTO();
        room.setWalls(List.of());
        room.setDoors(List.of());
        room.setWindows(List.of());
        room.setPlugs(List.of());

        assertThat(room.getWalls()).isEmpty();
        assertThat(room.getDoors()).isEmpty();
        assertThat(room.getWindows()).isEmpty();
        assertThat(room.getPlugs()).isEmpty();
    }

    // ==== SetupBuildDTO ====

    @Test
    void setupBuildDTO_gettersAndSetters() {
        SetupBuildDTO setup = new SetupBuildDTO();
        setup.setId("setup-1");
        setup.setScale("1:100");
        setup.setMaxBudget(5000.0);
        setup.setTargetEcosystem("Zigbee");

        RoomDTO room = new RoomDTO();
        room.setId("r1");
        setup.setRooms(List.of(room));

        PlacedDeviceDTO device = new PlacedDeviceDTO();
        setup.setDevices(List.of(device));

        assertThat(setup.getId()).isEqualTo("setup-1");
        assertThat(setup.getScale()).isEqualTo("1:100");
        assertThat(setup.getMaxBudget()).isEqualTo(5000.0);
        assertThat(setup.getTargetEcosystem()).isEqualTo("Zigbee");
        assertThat(setup.getRooms()).hasSize(1);
        assertThat(setup.getDevices()).hasSize(1);
    }

    @Test
    void setupBuildDTO_equality() {
        SetupBuildDTO s1 = new SetupBuildDTO();
        s1.setId("same-id");
        s1.setScale("1:50");
        s1.setMaxBudget(1000.0);
        s1.setTargetEcosystem("Z-Wave");

        SetupBuildDTO s2 = new SetupBuildDTO();
        s2.setId("same-id");
        s2.setScale("1:50");
        s2.setMaxBudget(1000.0);
        s2.setTargetEcosystem("Z-Wave");

        assertThat(s1).isEqualTo(s2);
        assertThat(s1.hashCode()).isEqualTo(s2.hashCode());
    }

    @Test
    void setupBuildDTO_inequality_differentScale() {
        SetupBuildDTO s1 = new SetupBuildDTO();
        s1.setId("id");
        s1.setScale("1:50");

        SetupBuildDTO s2 = new SetupBuildDTO();
        s2.setId("id");
        s2.setScale("1:100");

        assertThat(s1).isNotEqualTo(s2);
    }

    @Test
    void setupBuildDTO_nullFieldsByDefault() {
        SetupBuildDTO setup = new SetupBuildDTO();
        assertThat(setup.getId()).isNull();
        assertThat(setup.getScale()).isNull();
        assertThat(setup.getMaxBudget()).isNull();
        assertThat(setup.getTargetEcosystem()).isNull();
        assertThat(setup.getRooms()).isNull();
        assertThat(setup.getDevices()).isNull();
    }

    @Test
    void setupBuildDTO_toString_containsFieldValues() {
        SetupBuildDTO setup = new SetupBuildDTO();
        setup.setId("my-layout");
        setup.setScale("1:200");

        String str = setup.toString();
        assertThat(str).contains("my-layout");
        assertThat(str).contains("1:200");
    }
}