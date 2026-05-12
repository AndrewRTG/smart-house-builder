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
class WizardOptimizerServiceTest {

    @Mock
    private HardwareDeviceRepository repository;

    @InjectMocks
    private WizardOptimizerService wizardOptimizerService;

    @Test
    void getDeviceSuggestions_returnsRepositorySuggestions() {
        List<HardwareDevice> expected = List.of(
                HardwareDevice.builder().id(1L).name("Hub").build(),
                HardwareDevice.builder().id(2L).name("Sensor").build()
        );
        when(repository.findRandomDevices()).thenReturn(expected);

        var result = wizardOptimizerService.getDeviceSuggestions();

        assertThat(result).isSameAs(expected);
    }
}
