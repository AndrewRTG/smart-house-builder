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
public class CaseSmartParser implements StoreParser {

    @Override
    public String getStoreIdentifier() {
        return "CASESMART";
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
        // Am adăugat "intrerupator" și "touch" care sunt specifice acestui magazin
        return content.contains("camera") || content.contains("ip") ||
                content.contains("hub") || content.contains("senzor") ||
                content.contains("smart") || content.contains("priza") ||
                content.contains("releu") || content.contains("intrerupator") ||
                content.contains("touch");
    }

    private DeviceImportDto convertToDto(StoreXmlItem xmlItem) {
        DeviceImportDto dto = new DeviceImportDto();
        dto.setName(xmlItem.title);
        dto.setPrice(xmlItem.price);
        dto.setDescription(xmlItem.description);
        dto.setSourceStore("CASESMART");

        if (xmlItem.imageUrls != null && !xmlItem.imageUrls.isEmpty()) {
            dto.setImageUrl(xmlItem.imageUrls.split(",")[0].trim());
        }

        dto.setBrand(extractBrand(xmlItem));

        dto.setCategoryId(determineCategoryId(xmlItem));

        return dto;
    }

    private String extractBrand(StoreXmlItem item) {
        // Căutăm explicit formatul "Brand : " din descrierea CaseSmart
        if (item.description != null && item.description.contains("Brand :")) {
            String[] parts = item.description.split("Brand :");
            if (parts.length > 1) {
                return parts[1].trim().split("\\s+")[0].replaceAll("[^a-zA-Z0-9-]", "");
            }
        }
        // Fallback dacă brandul e scris direct în titlu (ex: Livolo)
        if (item.title != null && item.title.toLowerCase().contains("livolo")) {
            return "Livolo";
        }
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
        else if (text.contains("priza") || text.contains("socket") || text.contains("releu") || text.contains("intrerupator")) return 7;
        else if (text.contains("senzor") || text.contains("detector") || text.contains("sirena") || text.contains("buton") || text.contains("meter")) return 8;
        else if (text.contains("audio") || text.contains("boxa") || text.contains("soundbar")) return 9;
        else if (text.contains("tv ") || text.contains("televizor")) return 10;
        else if (text.contains("aspirator") || text.contains("robot")) return 11;
        else if (text.contains("router") || text.contains("switch") || text.contains("access point")) return 12;

        return null;
    }
}