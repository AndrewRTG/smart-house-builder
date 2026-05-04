package gr.A4.SmartHouseBuilder.tools;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DeviceTools {

    private final HardwareDeviceRepository deviceRepository;

    public DeviceTools(HardwareDeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Tool(description = """
            Retrieves ALL smart home devices from the database.
            Use this when the user wants to browse everything with no filters.
            """)
    public List<HardwareDevice> getAllDevices() {
        return deviceRepository.findAll();
    }
}
