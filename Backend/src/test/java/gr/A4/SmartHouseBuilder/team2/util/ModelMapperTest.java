package gr.A4.SmartHouseBuilder.team2.util;

import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.team2.dto.CoordinatesDTO;
import gr.A4.SmartHouseBuilder.team2.dto.DeviceDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceRichDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.Test;

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
        dto.setMaxBudget(2500.0);
        dto.setTargetEcosystem("Google Home");

        SetupBuild model = mapper.toEngineModel(dto);

        assertNotNull(model);
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
}
