package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.service.LayoutIntegrationService;
import gr.A4.SmartHouseBuilder.team2.dto.CoordinatesDTO;
import gr.A4.SmartHouseBuilder.team2.dto.DeviceDTO;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceRichDTO;
import gr.A4.SmartHouseBuilder.team2.dto.RoomDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LayoutValidationControllerTest {

    @Mock
    private LayoutIntegrationService integrationService;

    @InjectMocks
    private LayoutValidationController controller;

    @Test
    void testValidateLayout_Success() {
        SetupBuild payload = new SetupBuild();
        ValidationResult mockResult = new ValidationResult();
        when(integrationService.integrateAndVerify(payload)).thenReturn(List.of(mockResult));

        ResponseEntity<List<ValidationResult>> response = controller.validateLayout(payload);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        verify(integrationService, times(1)).integrateAndVerify(payload);
    }

    @Test
    void testValidateLayoutDTO_Success() {
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("setup-123");
        dto.setScale("1:50");
        dto.setMaxBudget(2500.0);
        dto.setTargetEcosystem("Google Home");
        dto.setRooms(List.of(new RoomDTO()));

        PlacedDeviceRichDTO placed = new PlacedDeviceRichDTO();
        CoordinatesDTO coords = new CoordinatesDTO();
        coords.setX(0.0);
        coords.setY(0.0);
        placed.setCoordinates(coords);
        placed.setRotationAngle(0.0);
        DeviceDTO device = new DeviceDTO();
        device.setName("Test");
        device.setDeviceType("light");
        device.setProtocol("matter");
        device.setEcosystem("Google Home");
        placed.setDevice(device);
        dto.setDevices(List.of(placed));

        ValidationResult mockResult = new ValidationResult();
        when(integrationService.integrateAndVerify(any(SetupBuild.class))).thenReturn(List.of(mockResult));

        ResponseEntity<List<ValidationResult>> response = controller.validateLayoutDTO(dto);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        ArgumentCaptor<SetupBuild> captor = ArgumentCaptor.forClass(SetupBuild.class);
        verify(integrationService, times(1)).integrateAndVerify(captor.capture());

        SetupBuild capturedBuild = captor.getValue();
        assertNotNull(capturedBuild);
    }
}
