/*package gr.A4.SmartHouseBuilder.tools;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import gr.A4.SmartHouseBuilder.service.DeviceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceToolsTest {

    @Mock
    private HardwareDeviceRepository deviceRepository;


    @InjectMocks
    private DeviceService deviceService;
    @InjectMocks
    private DeviceTools deviceTools;

    @Test
    void testGetAllDevices_Success() {
        // GIVEN: Pregătim o listă simulată de dispozitive
        HardwareDevice device1 = new HardwareDevice();
        // Presupunând că HardwareDevice are setteri generați de Lombok sau expliciți
        // device1.setName("Smart Bulb");

        HardwareDevice device2 = new HardwareDevice();

        List<HardwareDevice> mockDevices = List.of(device1, device2);

        // Definim comportamentul repository-ului simulat
        when(deviceRepository.findAll()).thenReturn(mockDevices);

        // WHEN: Apelăm metoda pe care o testăm
        List<HardwareDevice> result = deviceService.getAllDevices();

        // THEN: Verificăm că rezultatul corespunde cu așteptările
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(mockDevices, result);

        // Verificăm că repository-ul a fost apelat exact o dată prin metoda findAll()
        verify(deviceRepository, times(1)).findAll();
    }

    @Test
    void testGetAllDevices_EmptyList() {
        // GIVEN: Simulăm cazul în care baza de date nu conține niciun dispozitiv
        when(deviceRepository.findAll()).thenReturn(List.of());

        // WHEN
        List<HardwareDevice> result = deviceService.getAllDevices();

        // THEN
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(deviceRepository, times(1)).findAll();
    }
}*/