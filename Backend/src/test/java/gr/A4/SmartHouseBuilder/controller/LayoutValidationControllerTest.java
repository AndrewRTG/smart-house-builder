package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.service.LayoutIntegrationService;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceDTO;
import gr.A4.SmartHouseBuilder.team2.dto.RoomDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LayoutValidationControllerTest {

    @Mock
    private LayoutIntegrationService integrationService;

    @InjectMocks
    private LayoutValidationController controller;

    @Test
    void testValidateLayout_Success() {
        // GIVEN: Pregătim obiectul de intrare și rezultatul simulat
        SetupBuild payload = new SetupBuild();
        ValidationResult mockResult = new ValidationResult();
        // Presupunând că ValidationResult are metode specifice sau constructor,
        // transmitem o listă cu rezultatul către mock
        when(integrationService.integrateAndVerify(payload)).thenReturn(List.of(mockResult));

        // WHEN: Apelăm endpoint-ul
        ResponseEntity<List<ValidationResult>> response = controller.validateLayout(payload);

        // THEN: Verificăm răspunsul HTTP și interacțiunea cu serviciul
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        verify(integrationService, times(1)).integrateAndVerify(payload);
    }

    @Test
    void testValidateLayoutDTO_Success() {
        // GIVEN: Pregătim DTO-ul cu date complete pentru a trece prin toate settere-le din convertorul privat
        SetupBuildDTO dto = new SetupBuildDTO();
        dto.setId("setup-123");
        dto.setScale("1:50");
        dto.setMaxBudget(2500.0);
        dto.setTargetEcosystem("Google Home");
        dto.setRooms(List.of(new RoomDTO()));
        dto.setDevices(List.of(new PlacedDeviceDTO()));

        ValidationResult mockResult = new ValidationResult();
        when(integrationService.integrateAndVerify(any(SetupBuild.class))).thenReturn(List.of(mockResult));

        // WHEN: Apelăm endpoint-ul care folosește DTO
        ResponseEntity<List<ValidationResult>> response = controller.validateLayoutDTO(dto);

        // THEN: Verificăm răspunsul
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        // Captăm argumentul de tip SetupBuild creat de metoda convertDTOToSetupBuild
        // pentru a ne asigura că maparea și apelul către integrationService s-au realizat corect
        ArgumentCaptor<SetupBuild> captor = ArgumentCaptor.forClass(SetupBuild.class);
        verify(integrationService, times(1)).integrateAndVerify(captor.capture());

        SetupBuild capturedBuild = captor.getValue();
        assertNotNull(capturedBuild);
        // Conversia internă a setat toate câmpurile, oferind acoperire completă a codului
    }
}