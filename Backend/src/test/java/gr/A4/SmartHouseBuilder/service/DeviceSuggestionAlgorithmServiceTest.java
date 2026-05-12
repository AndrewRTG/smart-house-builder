package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeviceSuggestionAlgorithmServiceTest {

    @Mock
    private HardwareDeviceRepository deviceRepository;

    @InjectMocks
    private DeviceSuggestionAlgorithmService service;

    @Test
    void getSmartSuggestions_returnsDevicesWithinBudgetForGenericCriteria() {
        HardwareDevice hub = HardwareDevice.builder()
                .id(1L)
                .categoryId(5)
                .name("Universal Hub")
                .brand("Aqara")
                .communicationProtocol("ZIGBEE")
                .specifications("{}")
                .price(40.0)
                .build();
        HardwareDevice light = HardwareDevice.builder()
                .id(2L)
                .categoryId(4)
                .name("Smart Light")
                .brand("Philips")
                .communicationProtocol("WIFI")
                .specifications("{}")
                .price(30.0)
                .build();
        when(deviceRepository.findAll()).thenReturn(List.of(hub, light));

        var result = service.getSmartSuggestions(
                "Buget: 100. Categorii dorite: Toate. Ecosistem: Oricare. Nivel: Oricare"
        );

        assertThat(result).extracting(HardwareDevice::getName)
                .contains("Universal Hub", "Smart Light");
    }

    @Test
    void getSmartSuggestions_filtersOutIncompatibleGoogleEcosystemDevices() {
        HardwareDevice googleSpeaker = HardwareDevice.builder()
                .id(1L)
                .categoryId(9)
                .name("Google Speaker")
                .brand("Google")
                .communicationProtocol("WIFI")
                .specifications("{}")
                .price(50.0)
                .build();
        HardwareDevice amazonSpeaker = HardwareDevice.builder()
                .id(2L)
                .categoryId(9)
                .name("Amazon Speaker")
                .brand("Amazon")
                .communicationProtocol("WIFI")
                .specifications("{}")
                .price(50.0)
                .build();
        when(deviceRepository.findAll()).thenReturn(List.of(googleSpeaker, amazonSpeaker));

        var result = service.getSmartSuggestions(
                "Buget: 100. Categorii dorite: Entertainment. Ecosistem: Google Home. Nivel: Oricare"
        );

        assertThat(result).extracting(HardwareDevice::getName)
                .contains("Google Speaker")
                .doesNotContain("Amazon Speaker");
    }
}
