package gr.A4.SmartHouseBuilder.tools;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // Folosim Mockito simplu, fără a încărca tot Spring-ul
class DeviceToolsTest {

    @Mock
    private HardwareDeviceRepository deviceRepository;

    @InjectMocks
    private DeviceTools deviceTools;

    private List<HardwareDevice> mockDevices;

    @BeforeEach
    void setUp() {
        // Creăm o listă de 15 dispozitive false pentru a testa dacă funcționează limitarea de 10
        mockDevices = new ArrayList<>();
        for (long i = 1; i <= 15; i++) {
            HardwareDevice device = new HardwareDevice();
            device.setId(i);
            device.setName("Smart Device " + i);
            mockDevices.add(device);
        }
    }

    @Test
    void searchByCategory_ReturnsMax10Devices() {
        // Arrange
        Integer categoryId = 10; // TV
        // Când se apelează baza de date, returnăm lista de 15
        when(deviceRepository.findTop50ByCategoryId(categoryId)).thenReturn(mockDevices);

        // Act
        List<HardwareDevice> result = deviceTools.searchByCategory(categoryId);

        // Assert
        assertEquals(10, result.size(), "Trebuie să returneze maxim 10 elemente, datorită limitei din tool.");
        verify(deviceRepository, times(1)).findTop50ByCategoryId(categoryId);
    }

    @Test
    void searchByCategory_ReturnsEmptyList_WhenNoDevicesFound() {
        // Arrange
        Integer categoryId = 99; // Categorie inexistentă
        when(deviceRepository.findTop50ByCategoryId(categoryId)).thenReturn(new ArrayList<>());

        // Act
        List<HardwareDevice> result = deviceTools.searchByCategory(categoryId);

        // Assert
        assertTrue(result.isEmpty(), "Lista trebuie să fie goală dacă nu s-au găsit produse în baza de date.");
    }

    @Test
    void searchByBudget_ReturnsAvailableDevices_WhenLessThan10() {
        // Arrange
        Double budget = 150.0;
        // Simulăm cazul în care găsim doar 5 produse în buget (mai puțin de 10)
        List<HardwareDevice> smallList = mockDevices.subList(0, 5);
        when(deviceRepository.findTop50ByPriceLessThanEqual(budget)).thenReturn(smallList);

        // Act
        List<HardwareDevice> result = deviceTools.searchByBudget(budget);

        // Assert
        assertEquals(5, result.size(), "Trebuie să returneze toate cele 5 elemente găsite.");
        verify(deviceRepository, times(1)).findTop50ByPriceLessThanEqual(budget);
    }

    @Test
    void searchByBrand_ReturnsMax10Devices() {
        // Arrange
        String brand = "Samsung";
        when(deviceRepository.findTop50ByBrandIgnoreCase(brand)).thenReturn(mockDevices);

        // Act
        List<HardwareDevice> result = deviceTools.searchByBrand(brand);

        // Assert
        assertEquals(10, result.size());
        verify(deviceRepository, times(1)).findTop50ByBrandIgnoreCase(brand);
    }
}