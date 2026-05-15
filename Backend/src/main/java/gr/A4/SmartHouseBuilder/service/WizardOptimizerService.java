package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WizardOptimizerService {

    private final HardwareDeviceRepository repository;

    public List<HardwareDevice> getDeviceSuggestions() {
        return repository.findRandomDevices();
    }
}
