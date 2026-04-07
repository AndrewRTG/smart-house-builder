package gr.A4.SmartHouseBuilder.team2.dto;

import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for all DTO classes added in this PR.
 * All DTOs use Lombok @Data which generates getters, setters, equals, hashCode and toString.
 */
class DtoTest {

    // ---- PointDTO ----

    @Test
    void pointDTO_settersAndGetters_work() {
        PointDTO point = new PointDTO();
        point.setX(3.5);
        point.setY(7.0);
        assertThat(point.getX()).isEqualTo(3.5);
        assertThat(point.getY()).isEqualTo(7.0);
    }

    @Test
    void pointDTO_defaultValues_areNull() {
        PointDTO point = new PointDTO();
        assertThat(point.getX()).isNull();
        assertThat(point.getY()).isNull();
    }

    @Test
    void pointDTO_equals_sameValues_areEqual() {
        PointDTO p1 = new PointDTO();
        p1.setX(1.0); p1.setY(2.0);
        PointDTO p2 = new PointDTO();
        p2.setX(1.0); p2.setY(2.0);
        assertThat(p1).isEqualTo(p2);
        assertThat(p1.hashCode()).isEqualTo(p2.hashCode());
    }

    @Test
    void pointDTO_equals_differentValues_notEqual() {
        PointDTO p1 = new PointDTO();
        p1.setX(1.0); p1.setY(2.0);
        PointDTO p2 = new PointDTO();
        p2.setX(3.0); p2.setY(4.0);
        assertThat(p1).isNotEqualTo(p2);
    }

    @Test
    void pointDTO_toString_containsFieldValues() {
        PointDTO point = new PointDTO();
        point.setX(5.0); point.setY(6.0);
        String str = point.toString();
        assertThat(str).contains("5.0").contains("6.0");
    }

    // ---- WallDTO ----

    @Test
    void wallDTO_settersAndGetters_work() {
        WallDTO wall = new WallDTO();
        wall.setX1(0.0); wall.setY1(0.0);
        wall.setX2(10.0); wall.setY2(5.0);
        assertThat(wall.getX1()).isEqualTo(0.0);
        assertThat(wall.getY1()).isEqualTo(0.0);
        assertThat(wall.getX2()).isEqualTo(10.0);
        assertThat(wall.getY2()).isEqualTo(5.0);
    }

    @Test
    void wallDTO_defaultValues_areNull() {
        WallDTO wall = new WallDTO();
        assertThat(wall.getX1()).isNull();
        assertThat(wall.getY1()).isNull();
        assertThat(wall.getX2()).isNull();
        assertThat(wall.getY2()).isNull();
    }

    @Test
    void wallDTO_equals_sameCoordinates_areEqual() {
        WallDTO w1 = new WallDTO();
        w1.setX1(1.0); w1.setY1(2.0); w1.setX2(3.0); w1.setY2(4.0);
        WallDTO w2 = new WallDTO();
        w2.setX1(1.0); w2.setY1(2.0); w2.setX2(3.0); w2.setY2(4.0);
        assertThat(w1).isEqualTo(w2);
        assertThat(w1.hashCode()).isEqualTo(w2.hashCode());
    }

    @Test
    void wallDTO_equals_differentEndPoint_notEqual() {
        WallDTO w1 = new WallDTO();
        w1.setX1(0.0); w1.setY1(0.0); w1.setX2(5.0); w1.setY2(5.0);
        WallDTO w2 = new WallDTO();
        w2.setX1(0.0); w2.setY1(0.0); w2.setX2(10.0); w2.setY2(10.0);
        assertThat(w1).isNotEqualTo(w2);
    }

    // ---- WindowDTO ----

    @Test
    void windowDTO_settersAndGetters_work() {
        WindowDTO window = new WindowDTO();
        window.setX(2.0); window.setY(3.0);
        window.setWidth(1.5); window.setHeight(1.2);
        window.setDistanceFromFloor(0.9);
        assertThat(window.getX()).isEqualTo(2.0);
        assertThat(window.getY()).isEqualTo(3.0);
        assertThat(window.getWidth()).isEqualTo(1.5);
        assertThat(window.getHeight()).isEqualTo(1.2);
        assertThat(window.getDistanceFromFloor()).isEqualTo(0.9);
    }

    @Test
    void windowDTO_defaultValues_areNull() {
        WindowDTO window = new WindowDTO();
        assertThat(window.getX()).isNull();
        assertThat(window.getY()).isNull();
        assertThat(window.getWidth()).isNull();
        assertThat(window.getHeight()).isNull();
        assertThat(window.getDistanceFromFloor()).isNull();
    }

    @Test
    void windowDTO_equals_sameValues_areEqual() {
        WindowDTO w1 = new WindowDTO();
        w1.setX(1.0); w1.setY(2.0); w1.setWidth(3.0); w1.setHeight(4.0); w1.setDistanceFromFloor(0.5);
        WindowDTO w2 = new WindowDTO();
        w2.setX(1.0); w2.setY(2.0); w2.setWidth(3.0); w2.setHeight(4.0); w2.setDistanceFromFloor(0.5);
        assertThat(w1).isEqualTo(w2);
    }

    // ---- DeviceDTO ----

    @Test
    void deviceDTO_settersAndGetters_work() {
        DeviceDTO device = new DeviceDTO();
        device.setId("dev-1");
        device.setName("Philips Hue");
        device.setPrice(49.99);
        device.setEcosystem("Philips");
        device.setProtocol("Zigbee");
        device.setLumens(800);
        device.setRequiresPlug(false);
        device.setRangeRadius(10.0);
        device.setDeviceType("bulb");
        device.setMountType("ceiling");
        device.setFieldOfView(120.0);
        device.setPowerConsumption(9.0);
        device.setCommunicationFrequency("2.4GHz");
        device.setWidth(6.5);

        assertThat(device.getId()).isEqualTo("dev-1");
        assertThat(device.getName()).isEqualTo("Philips Hue");
        assertThat(device.getPrice()).isEqualTo(49.99);
        assertThat(device.getEcosystem()).isEqualTo("Philips");
        assertThat(device.getProtocol()).isEqualTo("Zigbee");
        assertThat(device.getLumens()).isEqualTo(800);
        assertThat(device.getRequiresPlug()).isFalse();
        assertThat(device.getRangeRadius()).isEqualTo(10.0);
        assertThat(device.getDeviceType()).isEqualTo("bulb");
        assertThat(device.getMountType()).isEqualTo("ceiling");
        assertThat(device.getFieldOfView()).isEqualTo(120.0);
        assertThat(device.getPowerConsumption()).isEqualTo(9.0);
        assertThat(device.getCommunicationFrequency()).isEqualTo("2.4GHz");
        assertThat(device.getWidth()).isEqualTo(6.5);
    }

    @Test
    void deviceDTO_defaultValues_areNull() {
        DeviceDTO device = new DeviceDTO();
        assertThat(device.getId()).isNull();
        assertThat(device.getName()).isNull();
        assertThat(device.getPrice()).isNull();
        assertThat(device.getEcosystem()).isNull();
        assertThat(device.getProtocol()).isNull();
        assertThat(device.getLumens()).isNull();
        assertThat(device.getRequiresPlug()).isNull();
        assertThat(device.getRangeRadius()).isNull();
        assertThat(device.getDeviceType()).isNull();
        assertThat(device.getMountType()).isNull();
        assertThat(device.getFieldOfView()).isNull();
        assertThat(device.getPowerConsumption()).isNull();
        assertThat(device.getCommunicationFrequency()).isNull();
        assertThat(device.getWidth()).isNull();
    }

    @Test
    void deviceDTO_equals_sameValues_areEqual() {
        DeviceDTO d1 = new DeviceDTO();
        d1.setId("x"); d1.setName("Test"); d1.setPrice(10.0);
        DeviceDTO d2 = new DeviceDTO();
        d2.setId("x"); d2.setName("Test"); d2.setPrice(10.0);
        assertThat(d1).isEqualTo(d2);
        assertThat(d1.hashCode()).isEqualTo(d2.hashCode());
    }

    @Test
    void deviceDTO_equals_differentId_notEqual() {
        DeviceDTO d1 = new DeviceDTO();
        d1.setId("a");
        DeviceDTO d2 = new DeviceDTO();
        d2.setId("b");
        assertThat(d1).isNotEqualTo(d2);
    }

    // ---- PlacedDeviceDTO ----

    @Test
    void placedDeviceDTO_settersAndGetters_work() {
        PointDTO coords = new PointDTO();
        coords.setX(5.0); coords.setY(3.0);

        DeviceDTO device = new DeviceDTO();
        device.setId("dev-xyz");

        PlacedDeviceDTO placed = new PlacedDeviceDTO();
        placed.setCoordinates(coords);
        placed.setRotationAngle(90.0);
        placed.setDevice(device);

        assertThat(placed.getCoordinates()).isSameAs(coords);
        assertThat(placed.getRotationAngle()).isEqualTo(90.0);
        assertThat(placed.getDevice()).isSameAs(device);
    }

    @Test
    void placedDeviceDTO_defaultValues_areNull() {
        PlacedDeviceDTO placed = new PlacedDeviceDTO();
        assertThat(placed.getCoordinates()).isNull();
        assertThat(placed.getRotationAngle()).isNull();
        assertThat(placed.getDevice()).isNull();
    }

    @Test
    void placedDeviceDTO_equals_sameValues_areEqual() {
        PointDTO p = new PointDTO();
        p.setX(1.0); p.setY(1.0);

        PlacedDeviceDTO pd1 = new PlacedDeviceDTO();
        pd1.setCoordinates(p); pd1.setRotationAngle(0.0);

        PlacedDeviceDTO pd2 = new PlacedDeviceDTO();
        pd2.setCoordinates(p); pd2.setRotationAngle(0.0);

        assertThat(pd1).isEqualTo(pd2);
    }

    // ---- RoomDTO ----

    @Test
    void roomDTO_settersAndGetters_work() {
        WallDTO wall = new WallDTO();
        wall.setX1(0.0); wall.setY1(0.0); wall.setX2(5.0); wall.setY2(0.0);

        PointDTO door = new PointDTO();
        door.setX(2.5); door.setY(0.0);

        WindowDTO window = new WindowDTO();
        window.setX(1.0); window.setY(0.0); window.setWidth(1.0); window.setHeight(1.0);

        PointDTO plug = new PointDTO();
        plug.setX(4.0); plug.setY(0.5);

        RoomDTO room = new RoomDTO();
        room.setId("room-1");
        room.setSquareMeters(20.0);
        room.setWallType("brick");
        room.setWalls(List.of(wall));
        room.setDoors(List.of(door));
        room.setWindows(List.of(window));
        room.setPlugs(List.of(plug));

        assertThat(room.getId()).isEqualTo("room-1");
        assertThat(room.getSquareMeters()).isEqualTo(20.0);
        assertThat(room.getWallType()).isEqualTo("brick");
        assertThat(room.getWalls()).hasSize(1);
        assertThat(room.getDoors()).hasSize(1);
        assertThat(room.getWindows()).hasSize(1);
        assertThat(room.getPlugs()).hasSize(1);
    }

    @Test
    void roomDTO_defaultValues_areNull() {
        RoomDTO room = new RoomDTO();
        assertThat(room.getId()).isNull();
        assertThat(room.getSquareMeters()).isNull();
        assertThat(room.getWallType()).isNull();
        assertThat(room.getWalls()).isNull();
        assertThat(room.getDoors()).isNull();
        assertThat(room.getWindows()).isNull();
        assertThat(room.getPlugs()).isNull();
    }

    @Test
    void roomDTO_emptyLists_areSetCorrectly() {
        RoomDTO room = new RoomDTO();
        room.setWalls(Collections.emptyList());
        room.setDoors(Collections.emptyList());
        room.setWindows(Collections.emptyList());
        room.setPlugs(Collections.emptyList());
        assertThat(room.getWalls()).isEmpty();
        assertThat(room.getDoors()).isEmpty();
        assertThat(room.getWindows()).isEmpty();
        assertThat(room.getPlugs()).isEmpty();
    }

    @Test
    void roomDTO_equals_sameValues_areEqual() {
        RoomDTO r1 = new RoomDTO();
        r1.setId("r1"); r1.setSquareMeters(15.0); r1.setWallType("drywall");
        RoomDTO r2 = new RoomDTO();
        r2.setId("r1"); r2.setSquareMeters(15.0); r2.setWallType("drywall");
        assertThat(r1).isEqualTo(r2);
        assertThat(r1.hashCode()).isEqualTo(r2.hashCode());
    }

    // ---- SetupBuildDTO ----

    @Test
    void setupBuildDTO_settersAndGetters_work() {
        RoomDTO room = new RoomDTO();
        room.setId("room-1");

        PlacedDeviceDTO device = new PlacedDeviceDTO();

        SetupBuildDTO setup = new SetupBuildDTO();
        setup.setId("setup-001");
        setup.setScale("1:100");
        setup.setMaxBudget(25000.0);
        setup.setTargetEcosystem("Apple");
        setup.setRooms(List.of(room));
        setup.setDevices(List.of(device));

        assertThat(setup.getId()).isEqualTo("setup-001");
        assertThat(setup.getScale()).isEqualTo("1:100");
        assertThat(setup.getMaxBudget()).isEqualTo(25000.0);
        assertThat(setup.getTargetEcosystem()).isEqualTo("Apple");
        assertThat(setup.getRooms()).hasSize(1);
        assertThat(setup.getDevices()).hasSize(1);
    }

    @Test
    void setupBuildDTO_defaultValues_areNull() {
        SetupBuildDTO setup = new SetupBuildDTO();
        assertThat(setup.getId()).isNull();
        assertThat(setup.getScale()).isNull();
        assertThat(setup.getMaxBudget()).isNull();
        assertThat(setup.getTargetEcosystem()).isNull();
        assertThat(setup.getRooms()).isNull();
        assertThat(setup.getDevices()).isNull();
    }

    @Test
    void setupBuildDTO_equals_sameValues_areEqual() {
        SetupBuildDTO s1 = new SetupBuildDTO();
        s1.setId("a"); s1.setScale("1:50"); s1.setMaxBudget(100.0);
        SetupBuildDTO s2 = new SetupBuildDTO();
        s2.setId("a"); s2.setScale("1:50"); s2.setMaxBudget(100.0);
        assertThat(s1).isEqualTo(s2);
        assertThat(s1.hashCode()).isEqualTo(s2.hashCode());
    }

    @Test
    void setupBuildDTO_equals_differentBudget_notEqual() {
        SetupBuildDTO s1 = new SetupBuildDTO();
        s1.setMaxBudget(100.0);
        SetupBuildDTO s2 = new SetupBuildDTO();
        s2.setMaxBudget(200.0);
        assertThat(s1).isNotEqualTo(s2);
    }

    @Test
    void setupBuildDTO_toString_containsFieldNames() {
        SetupBuildDTO setup = new SetupBuildDTO();
        setup.setId("test-id");
        String str = setup.toString();
        assertThat(str).contains("test-id");
    }
}