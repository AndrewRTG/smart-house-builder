package gr.A4.SmartHouseBuilder.tools;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

@Component
public class DeviceTools {

    private final HardwareDeviceRepository deviceRepository;

    public DeviceTools(HardwareDeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Tool(description = """
            Caută dispozitive după categorie. TREBUIE să primești ID-ul categoriei.
            1 = Camere Smart, 2 = Prelungitoare, 3 = Console, 4 = Electrocasnice, 
            5 = Hub-uri, 6 = Monitoare, 7 = Prize, 8 = Senzori, 9 = Audio, 
            10 = Televizoare (TV), 11 = Aspiratoare, 12 = Routere.
            """)
    public List<HardwareDevice> searchByCategory(Integer categoryId) {
        List<HardwareDevice> devices = new ArrayList<>(deviceRepository.findTop50ByCategoryId(categoryId));
        Collections.shuffle(devices);
        return devices.stream().limit(10).toList();
    }

    @Tool(description = "Caută dispozitive sub prețul maxim specificat.")
    public List<HardwareDevice> searchByBudget(Double maxPrice) {
        List<HardwareDevice> devices = new ArrayList<>(deviceRepository.findTop50ByPriceLessThanEqual(maxPrice));
        Collections.shuffle(devices);
        return devices.stream().limit(10).toList();
    }

    @Tool(description = "Caută dispozitive produse de un anumit brand.")
    public List<HardwareDevice> searchByBrand(String brand) {
        List<HardwareDevice> devices = new ArrayList<>(deviceRepository.findTop50ByBrandIgnoreCase(brand));
        Collections.shuffle(devices);
        return devices.stream().limit(10).toList();
    }
}