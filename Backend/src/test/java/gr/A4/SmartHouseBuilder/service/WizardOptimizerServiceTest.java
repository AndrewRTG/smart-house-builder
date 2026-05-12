package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WizardOptimizerServiceTest {

    @Mock
    private HardwareDeviceRepository repository;

    @InjectMocks
    private WizardOptimizerService wizardOptimizerService;

    @Test
    void testGetDeviceSuggestions_Success() {
        // GIVEN: Pregătim o listă simulată de dispozitive
        HardwareDevice device1 = new HardwareDevice();
        device1.setId(1L);
        device1.setName("Smart Plug");

        HardwareDevice device2 = new HardwareDevice();
        device2.setId(2L);
        device2.setName("Motion Sensor");

        List<HardwareDevice> mockDevices = List.of(device1, device2);

        // Simulăm apelul către repository
        when(repository.findRandomDevices()).thenReturn(mockDevices);

        // WHEN: Apelăm metoda din serviciu
        List<HardwareDevice> result = wizardOptimizerService.getDeviceSuggestions();

        // THEN: Verificăm rezultatele
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Smart Plug", result.get(0).getName());

        // Verificăm că metoda din repository a fost apelată exact o dată
        verify(repository, times(1)).findRandomDevices();
    }

    @Test
    void testGetDeviceSuggestions_Empty() {
        // GIVEN: Repository-ul returnează o listă goală
        when(repository.findRandomDevices()).thenReturn(List.of());

        // WHEN
        List<HardwareDevice> result = wizardOptimizerService.getDeviceSuggestions();

        // THEN
        assertTrue(result.isEmpty());
        verify(repository).findRandomDevices();
    }
}