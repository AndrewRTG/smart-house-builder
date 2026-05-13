package gr.A4.SmartHouseBuilder.service.parser;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import gr.A4.SmartHouseBuilder.dto.xml.StoreXmlItem;
import gr.A4.SmartHouseBuilder.dto.xml.StoreXmlRoot;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Component
public class VonMagParser implements StoreParser {

    @Override
    public String getStoreIdentifier() {
        return "VONMAG"; // Identificatorul unic pentru Factory
    }

    @Override
    public List<DeviceImportDto> parse(InputStream xmlStream) {
        List<DeviceImportDto> validDevices = new ArrayList<>();
        XmlMapper xmlMapper = new XmlMapper();

        try {
            StoreXmlRoot data = xmlMapper.readValue(xmlStream, StoreXmlRoot.class);

            if (data.items != null) {
                for (StoreXmlItem xmlItem : data.items) {
                    if (isSmartHomeDevice(xmlItem)) {
                        validDevices.add(convertToDto(xmlItem));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return validDevices;
    }

    private boolean isSmartHomeDevice(StoreXmlItem item) {
        String content = (item.title + " " + item.description).toLowerCase();
        // Am adăugat cuvinte specifice vonMag: releu, meter
        return content.contains("camera") || content.contains("ip") ||
                content.contains("hub") || content.contains("senzor") ||
                content.contains("smart") || content.contains("priza") ||
                content.contains("releu") || content.contains("meter");
    }

    private DeviceImportDto convertToDto(StoreXmlItem xmlItem) {
        DeviceImportDto dto = new DeviceImportDto();
        dto.setName(xmlItem.title);
        dto.setPrice(xmlItem.price);
        dto.setDescription(xmlItem.description);
        dto.setSourceStore("VONMAG");

        if (xmlItem.imageUrls != null && !xmlItem.imageUrls.isEmpty()) {
            dto.setImageUrl(xmlItem.imageUrls.split(",")[0].trim());
        }

        dto.setBrand(extractBrand(xmlItem));

        dto.setCategoryId(determineCategoryId(xmlItem));

        return dto;
    }

    // VonMag nu are "Producator:", așa că verificăm titlul pentru branduri cunoscute
    private String extractBrand(StoreXmlItem item) {
        String title = item.title.toLowerCase();
        if (title.contains("huawei")) return "Huawei";
        if (title.contains("schneider")) return "Schneider";
        if (title.contains("dahua")) return "Dahua";
        if (title.contains("hikvision")) return "Hikvision";
        if (title.contains("g-u")) return "G-U";
        return "Generic";
    }

    // Logica e pregătită pentru mâine
    private Integer determineCategoryId(StoreXmlItem item) {
        String text = (item.title + " " + item.description).toLowerCase();

        if (text.contains("camera") || text.contains("camere") || text.contains("supraveghere")) return 1;
        else if (text.contains("prelungitor")) return 2;
        else if (text.contains("consola") || text.contains("playstation") || text.contains("xbox")) return 3;
        else if (text.contains("electrocasnic") || text.contains("frigider")) return 4;
        else if (text.contains("hub") || text.contains("gateway") || text.contains("xvr") || text.contains("nvr")) return 5;
        else if (text.contains("monitor") || text.contains("display")) return 6;
        else if (text.contains("priza") || text.contains("socket") || text.contains("releu")) return 7; // Am adăugat releul aici
        else if (text.contains("senzor") || text.contains("detector") || text.contains("sirena") || text.contains("meter")) return 8; // Am adăugat smart meter-ul aici
        else if (text.contains("audio") || text.contains("boxa") || text.contains("soundbar")) return 9;
        else if (text.contains("tv ") || text.contains("televizor")) return 10;
        else if (text.contains("aspirator") || text.contains("robot")) return 11;
        else if (text.contains("router") || text.contains("switch") || text.contains("access point")) return 12;

        return null;
    }
}