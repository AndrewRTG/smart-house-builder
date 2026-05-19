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
            Caută dispozitive după categorie. 
            TREBUIE să primești ca parametru ID-ul categoriei.
            Folosește următoarea mapare pentru a alege ID-ul corect atunci când utilizatorul cere un produs:
            1 = Camere Smart, 2 = Prelungitoare, 3 = Console Gaming, 4 = Electrocasnice, 
            5 = Hub-uri, 6 = Monitoare, 7 = Prize, 8 = Senzori, 9 = Audio, 
            10 = Televizoare (TV), 11 = Aspiratoare, 12 = Routere.
            Exemplu: Dacă userul vrea un televizor, apelează cu categoryId = 10.
            """)
    public List<HardwareDevice> searchByCategory(Integer categoryId) {
        return deviceRepository.findByCategoryId(categoryId);
    }

    @Tool(description = "Caută dispozitive care costă sub prețul maxim specificat (în euro/lei).")
    public List<HardwareDevice> searchByBudget(Double maxPrice) {
        return deviceRepository.findByPriceLessThanEqual(maxPrice);
    }

    @Tool(description = "Caută dispozitive produse de un anumit brand (ex: 'Philips', 'Xiaomi', 'Samsung').")
    public List<HardwareDevice> searchByBrand(String brand) {
        return deviceRepository.findByBrandIgnoreCase(brand);
    }
}