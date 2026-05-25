package gr.A4.SmartHouseBuilder.team2.util;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.Room;
import gr.A4.SmartHouseBuilder.model.Segment2D;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.team2.dto.CoordinatesDTO;
import gr.A4.SmartHouseBuilder.team2.dto.DeviceDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PointDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceRichDTO;
import gr.A4.SmartHouseBuilder.team2.dto.RoomDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.dto.WallDTO;
import gr.A4.SmartHouseBuilder.team2.dto.WindowDTO;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModelMapperTest {

    private final ModelMapper mapper = new ModelMapper();

    @Test
    void toEngineModel_returnsNullForNullDto() {
        assertNull(mapper.toEngineModel(null));
    }

    @Test
    void toEngineModel_copiesScalarFields() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("layout-1");
        dto.setScale("1:50");
        dto.setMaxBudget(2500.0);
        dto.setTargetEcosystem("Google Home");

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model);
        assertEquals("layout-1", model.getId());
        assertEquals("1:50", model.getScale());
        assertEquals(2500.0, model.getMaxBudget());
        assertEquals("Google Home", model.getTargetEcosystem());
    }

    @Test
    void toEngineModel_leavesDevicesNullWhenDtoHasNoDevices() {
        SetupBuildDTO dto = new SetupBuildDTO();

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model);
        assertNull(model.getDevices());
    }

    @Test
    void toEngineModel_mapsDevicesWithCoordinates() {
        SetupBuildDTO dto = new SetupBuildDTO();

        DeviceDTO device = new DeviceDTO();
        device.setName("Bec-1");
        device.setDeviceType("light");
        device.setProtocol("matter");
        device.setEcosystem("Google Home");

        CoordinatesDTO coords = new CoordinatesDTO();
        coords.setX(1.5);
        coords.setY(2.5);

        PlacedDeviceRichDTO placed = new PlacedDeviceRichDTO();
        placed.setDevice(device);
        placed.setCoordinates(coords);

        dto.setDevices(List.of(placed));

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model.getDevices());
        assertEquals(1, model.getDevices().size());

        PlacedDevice pd = model.getDevices().get(0);
        assertNotNull(pd.getDevice());
        assertEquals("Bec-1", pd.getDevice().getName());
        assertEquals("light", pd.getDevice().getDeviceType());
        assertEquals("matter", pd.getDevice().getProtocol());
        assertEquals("Google Home", pd.getDevice().getEcosystem());
        assertEquals(1.5, pd.getX());
        assertEquals(2.5, pd.getY());
    }

    @Test
    void toEngineModel_handlesEmptyDevicesList() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setDevices(List.of());

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model.getDevices());
        assertTrue(model.getDevices().isEmpty());
    }

    @Test
    void toEngineModel_mapsRooms() {
        SetupBuildDTO dto = new SetupBuildDTO();

        WallDTO wall = new WallDTO();
        wall.setX1(0.0);
        wall.setY1(0.0);
        wall.setX2(5.0);
        wall.setY2(0.0);

        PointDTO door = new PointDTO();
        door.setX(1.0);
        door.setY(0.0);

        WindowDTO window = new WindowDTO();
        window.setX(2.0);
        window.setY(0.0);
        window.setWidth(1.5);

        PointDTO plug = new PointDTO();
        plug.setX(3.0);
        plug.setY(0.2);

        RoomDTO roomDto = new RoomDTO();
        roomDto.setId("room-001");
        roomDto.setSquareMeters(24.0);
        roomDto.setWallType("concrete");
        roomDto.setWalls(List.of(wall));
        roomDto.setDoors(List.of(door));
        roomDto.setWindows(List.of(window));
        roomDto.setPlugs(List.of(plug));

        dto.setRooms(List.of(roomDto));

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model.getRooms());
        assertEquals(1, model.getRooms().size());

        Room room = model.getRooms().get(0);
        assertEquals("room-001", room.getId());
        assertEquals(24.0, room.getSquareMeters());
        assertEquals("concrete", room.getWallType());

        Segment2D mappedWall = room.getWalls().get(0);
        assertEquals(0.0, mappedWall.getX1());
        assertEquals(0.0, mappedWall.getY1());
        assertEquals(5.0, mappedWall.getX2());
        assertEquals(0.0, mappedWall.getY2());

        Segment2D mappedDoor = room.getDoors().get(0);
        assertEquals(1.0, mappedDoor.getX1());
        assertEquals(0.0, mappedDoor.getY1());
        assertEquals(1.0, mappedDoor.getX2());
        assertEquals(0.0, mappedDoor.getY2());

        Segment2D mappedWindow = room.getWindows().get(0);
        assertEquals(2.0, mappedWindow.getX1());
        assertEquals(0.0, mappedWindow.getY1());
        assertEquals(3.5, mappedWindow.getX2());
        assertEquals(0.0, mappedWindow.getY2());

        assertEquals(3.0, room.getPlugs().get(0).getX());
        assertEquals(0.2, room.getPlugs().get(0).getY());
    }

    @Test
    void toEngineModel_handlesPlacedDeviceWithoutDeviceOrCoordinates() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setDevices(List.of(new PlacedDeviceRichDTO()));

        SetupBuild model = mapper.toEngineModel(dto);

        PlacedDevice pd = model.getDevices().get(0);
        assertNotNull(pd.getDevice());
        assertNull(pd.getDevice().getName());
        assertNull(pd.getX());
        assertNull(pd.getY());
    }

    @Test
    void toEngineModel_handlesNullPlacedDeviceEntries() {
        // A null element in the devices stream exercises the `dto != null` =
        // false short-circuit branches in both the device and coordinates
        // guards of mapDevice.
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setDevices(Arrays.asList((PlacedDeviceRichDTO) null));

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model.getDevices());
        assertEquals(1, model.getDevices().size());
        PlacedDevice pd = model.getDevices().get(0);
        assertNotNull(pd.getDevice());
        assertNull(pd.getDevice().getName());
        assertNull(pd.getX());
        assertNull(pd.getY());
    }
}
