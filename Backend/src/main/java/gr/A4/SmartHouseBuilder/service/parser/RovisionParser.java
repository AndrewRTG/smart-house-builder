package gr.A4.SmartHouseBuilder.service.parser;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import gr.A4.SmartHouseBuilder.dto.xml.StoreXmlItem;
import gr.A4.SmartHouseBuilder.dto.xml.StoreXmlRoot;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class RovisionParser implements StoreParser {

    // Adaugam lista completa de branduri extrase din XML-ul real
    private static final List<String> KNOWN_BRANDS = Arrays.asList(
            "HIKVISION", "DAHUA", "UNV", "UNIVIEW", "TP-LINK", "TRENDNET", "MIKROTIK",
            "DSC", "OPTEX", "EZVIZ", "REOLINK", "IMOU", "TAPO", "CELO", "WAGO",
            "PLASTIM", "WKK", "RUIJIE", "ASYTECH", "UNIPOS", "PULSAR", "CISA",
            "MOTORLINE", "PEIYING", "MEAN WELL", "KEMOT", "TED", "ZYXEL", "YDS", "AKAI"
    );

    @Override
    public String getStoreIdentifier() {
        return "ROVISION";
    }

    @Override
    public List<DeviceImportDto> parse(InputStream xmlStream) {
        List<DeviceImportDto> validDevices = new ArrayList<>();
        XmlMapper xmlMapper = new XmlMapper();

        try {
            // Folosim noile noastre clase generale
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
        String title = item.title != null ? item.title.toLowerCase() : "";

        // 1. FILTRUL DE GUNOI: Opreste accesoriile sa intre in baza de date
        String[] junkKeywords = {
                "cablu", "mufa", "conector", "doza", "suport", "colier", "surub", "burghi",
                "manson", "hdd", "hard disk", "rack", "sursa", "alimentator", "cutie",
                "cleste", "banda", "patch", "terminal", "bloc", "clema", "diblu", "acumulator",
                "baterie", "incalzitor", "accesoriu", "adaptor", "tester", "multimetru",
                "clampmetru", "rola", "tambur", "sertizabil", "splitter", "injector", "protectie", "capac",
                "tastatura", "buton iesire", "spray"
        };

        for (String junk : junkKeywords) {
            if (title.contains(junk)) {
                return false; // Respinge produsul
            }
        }

        // 2. Daca a trecut de filtru, vedem daca se potriveste la ceva "Smart"
        String content = title + " " + (item.description != null ? item.description.toLowerCase() : "");
        return content.contains("camera") || content.contains("ip") || content.contains("ptz") ||
                content.contains("hub") || content.contains("nvr") || content.contains("dvr") || content.contains("xvr") ||
                content.contains("centrala") || content.contains("senzor") || content.contains("detector") ||
                content.contains("smart") || content.contains("priza") || content.contains("sirena") ||
                content.contains("router") || content.contains("switch") || content.contains("access point") ||
                content.contains("interfon") || content.contains("yala") || content.contains("sistem supraveghere");
    }

    private DeviceImportDto convertToDto(StoreXmlItem xmlItem) {
        DeviceImportDto dto = new DeviceImportDto();
        dto.setName(xmlItem.title);
        dto.setPrice(xmlItem.price);
        dto.setDescription(xmlItem.description);
        dto.setSourceStore("ROVISION");

        if (xmlItem.imageUrls != null && !xmlItem.imageUrls.isEmpty()) {
            dto.setImageUrl(xmlItem.imageUrls.split(",")[0].trim());
        }

        dto.setBrand(extractBrand(xmlItem));
        dto.setCategoryId(determineCategoryId(xmlItem));

        return dto;
    }

    private String extractBrand(StoreXmlItem item) {
        String title = (item.title != null) ? item.title.toUpperCase() : "";
        String description = (item.description != null) ?
                item.description.replaceAll("&nbsp;", " ").replaceAll("<[^>]*>", " ").toUpperCase() : "";

        // PASUL 1: Verificam Titlul din lista noastra extinsa
        for (String brand : KNOWN_BRANDS) {
            if (title.contains(brand)) return brand;
        }

        // PASUL 2: Cautam dupa PRODUCATOR:
        if (description.contains("PRODUCATOR:")) {
            try {
                String afterLabel = description.split("PRODUCATOR:")[1].trim();
                String found = afterLabel.split("[\\s,;:<>&]+")[0].trim();
                if (found.length() > 2) return found;
            } catch (Exception e) {
                // Trecem mai departe
            }
        }

        // PASUL 3: Scanam descrierea
        for (String brand : KNOWN_BRANDS) {
            if (description.contains(brand)) return brand;
        }

        return "Generic";
    }

    private Integer determineCategoryId(StoreXmlItem item) {
        String title = item.title != null ? item.title.toLowerCase() : "";
        String content = title + " " + (item.description != null ? item.description.toLowerCase() : "");

        if (content.contains("camera") || content.contains("camere") || title.contains("sistem supraveghere") || content.contains("ptz")) return 1;
        else if (content.contains("prelungitor")) return 2;
        else if (content.contains("consola") || content.contains("playstation") || content.contains("xbox")) return 3;
        else if (content.contains("electrocasnic") || content.contains("frigider")) return 4;
        else if (content.contains("nvr") || content.contains("dvr") || content.contains("xvr") || content.contains("centrala") || content.contains("hub") || content.contains("gateway")) return 5;
        else if (content.contains("interfon") || content.contains("monitor") || content.contains("display") || content.contains("ecran")) return 6;
        else if (content.contains("priza") || content.contains("releu")) return 7;
        else if (content.contains("senzor") || content.contains("detector") || content.contains("sirena") || content.contains("contact magnetic") || content.contains("yala") || content.contains("alarma")) return 8;
        else if (content.contains("audio") || content.contains("boxa")) return 9;
        else if (content.contains("tv ") || content.contains("televizor")) return 10;
        else if (content.contains("aspirator") || content.contains("robot")) return 11;
        else if (content.contains("router") || content.contains("switch") || content.contains("access point") || content.contains("antena") || content.contains("convertor")) return 12;

        return null; // Returnam null ca sa se ocupe DeviceImportService cu fallback-ul pe ID 1
    }
}