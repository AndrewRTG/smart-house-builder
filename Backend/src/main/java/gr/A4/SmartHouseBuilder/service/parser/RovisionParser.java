package gr.A4.SmartHouseBuilder.service.parser;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import gr.A4.SmartHouseBuilder.dto.xml.StoreXmlItem;
import gr.A4.SmartHouseBuilder.dto.xml.StoreXmlRoot;
import gr.A4.SmartHouseBuilder.service.parser.specifications.SpecificationMapper;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class RovisionParser implements StoreParser {

    private static final String STORE_NAME = "ROVISION";

    private static final List<String> KNOWN_BRANDS = List.of(
            "HIKVISION",
            "HILOOK",
            "DAHUA",
            "UNV",
            "UNIVIEW",
            "TP-LINK",
            "TAPO",
            "EZVIZ",
            "REOLINK",
            "IMOU",
            "DSC",
            "UNIPOS",
            "CISA",
            "MOTORLINE",
            "MIKROTIK",
            "RUIJIE",
            "ZYXEL",
            "TRENDNET",
            "WAGO",
            "PULSAR",
            "MEAN WELL",
            "YLI",
            "AKAI",
            "SONOFF",
            "SHELLY",
            "YEELIGHT",
            "PHILIPS",
            "HUE",
            "LEDVANCE",
            "OSRAM",
            "NANOLEAF",
            "TELLUR",
            "GOSUND",
            "BROADLINK",
            "MEROSS",
            "XIAOMI",
            "AQARA"
    );

    @Override
    public String getStoreIdentifier() {
        return STORE_NAME;
    }

    @Override
    public List<DeviceImportDto> parse(InputStream xmlStream) {
        List<DeviceImportDto> devices = new ArrayList<>();
        XmlMapper xmlMapper = new XmlMapper();

        try {
            StoreXmlRoot data = xmlMapper.readValue(xmlStream, StoreXmlRoot.class);

            if (data == null || data.items == null) {
                return devices;
            }

            for (StoreXmlItem xmlItem : data.items) {
                if (!isValidBaseItem(xmlItem)) {
                    continue;
                }

                if (isAccessoryOrJunk(xmlItem)) {
                    continue;
                }

                if (isKnownWrongRovisionProduct(xmlItem)) {
                    continue;
                }

                if (!hasStrongRelevantSignal(xmlItem)) {
                    continue;
                }

                String title = normalized(xmlItem.title);
                String description = normalized(xmlItem.description);
                String text = title + " " + description;

                Integer categoryId;

                /*
                 * 13 - BECURI SMART / iluminat smart.
                 * Punem regula explicit aici ca sa nu depindem doar de mapper.
                 */
                if (isSmartLight(title, text)) {
                    categoryId = 13;
                } else {
                    categoryId = CategoryMapper.determineCategoryId(
                            xmlItem.title,
                            xmlItem.description
                    );
                }

                if (categoryId != null) {
                    if (categoryId == 8 && containsAny(title,
                            "camera de supraveghere dome",
                            "dahua hac-t3a21"
                    )) {
                        categoryId = 1;
                    }

                    if (categoryId == 8 && containsAny(title,
                            "kit sistem de alarma wireless dahua",
                            "art-arc3800h"
                    )) {
                        categoryId = 5;
                    }
                }

                if (categoryId == null) {
                    continue;
                }if (categoryId == null) {
                    continue;
                }

                DeviceImportDto dto = convertToDto(xmlItem, categoryId);

                if (dto != null) {
                    devices.add(dto);
                }
            }

            devices.sort(Comparator.comparingInt(this::smartScore).reversed());

        } catch (Exception e) {
            System.out.println("Eroare la parsarea feed-ului ROVISION: " + e.getMessage());
        }

        return devices;
    }

    private boolean isValidBaseItem(StoreXmlItem item) {
        if (item == null) {
            return false;
        }

        if (isBlank(item.title)) {
            return false;
        }

        if (item.price == null || item.price <= 0) {
            return false;
        }

        if (isBlank(item.affCode)) {
            return false;
        }

        return true;
    }

    private DeviceImportDto convertToDto(StoreXmlItem xmlItem, Integer categoryId) {
        DeviceImportDto dto = new DeviceImportDto();

        dto.setName(cleanText(xmlItem.title));
        dto.setPrice(xmlItem.price);
        dto.setBrand(extractBrand(xmlItem));
        dto.setDescription(cleanText(xmlItem.description));
        dto.setImageUrl(extractFirstImage(xmlItem.imageUrls));
        dto.setProductUrl(cleanText(xmlItem.affCode));
        dto.setSourceStore(STORE_NAME);
        dto.setCategoryId(categoryId);
        dto.setCommunicationProtocol(extractCommunicationProtocol(xmlItem));

        dto.setSpecifications(
                SpecificationMapper.buildSpecifications(
                        categoryId,
                        xmlItem.title,
                        xmlItem.description,
                        STORE_NAME
                )
        );

        return dto;
    }

    private boolean isSmartLight(String title, String text) {
        /*
         * Acceptam doar iluminat smart clar.
         * Nu vrem reflector/proiector/lampa solara simpla doar pentru ca are LED.
         */
        return containsAny(title,
                "bec inteligent",
                "bec smart",
                "bec led smart",
                "bec led inteligent",
                "smart bulb",
                "banda led smart",
                "banda led inteligenta",
                "smart light strip",
                "light strip smart",
                "kit banda led smart",
                "lampa smart",
                "lampa inteligenta",
                "plafoniera smart",
                "plafoniera inteligenta",
                "philips hue",
                "yeelight",
                "ledvance smart",
                "osram smart",
                "nanoleaf",
                "shelly rgbw",
                "sonoff l2-c"
        ) || (
                containsAny(title,
                        "bec",
                        "banda led",
                        "lampa",
                        "plafoniera",
                        "light strip"
                ) && containsAny(text,
                        "smart",
                        "inteligent",
                        "inteligenta",
                        "wi-fi",
                        "wifi",
                        "zigbee",
                        "matter",
                        "bluetooth",
                        "control aplicatie",
                        "control de pe telefon",
                        "aplicatie mobila",
                        "google home",
                        "alexa",
                        "homekit"
                )
        );
    }

    private boolean isAccessoryOrJunk(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;

        /*
         * Daca este bec/banda/lampa smart, nu o eliminam ca accesoriu,
         * chiar daca titlul contine "soclu E27", "adaptor" etc.
         */
        if (isSmartLight(title, text)) {
            return false;
        }

        return containsAny(title,
                "accesoriu",
                "suport",
                "suport camera",
                "suport detector",
                "rama",
                "rama montaj",
                "rama pentru",
                "soclu",
                "doza",
                "doza montaj",
                "cablu",
                "mufa",
                "conector",
                "adaptor",
                "alimentator",
                "sursa alimentare",
                "sursa",
                "baterie",
                "acumulator",
                "hdd",
                "hard disk",
                "rack",
                "surub",
                "diblu",
                "colier",
                "clema",
                "capac",
                "cutie montaj",
                "bracket",
                "lentila",
                "striker",
                "distantier",
                "distantiere",
                "tester",
                "multimetru",
                "cleste",
                "rola",
                "tambur",
                "spray",
                "injector poe",
                "splitter poe",
                "convertor",
                "media convertor",
                "patch panel",
                "sfp",

                "card de memorie",
                "card memorie",
                "micro sd",
                "microsd",
                "sd card",
                "emmc",
                "memorie",
                "viteza scriere",
                "viteza citire",
                "clasa 10",
                "uhs-i",

                "lanterna",
                "lanterna frontala",

                "limitator",
                "limitator switch",
                "encoder",

                "tag",
                "card mifare",
                "cartela",
                "telecomanda",
                "set montaj",
                "kit montaj"
        );
    }

    private boolean isKnownWrongRovisionProduct(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;

        /*
         * Daca este smart light clar, il lasam sa intre la categoria 13.
         * Totusi, reflectoarele/proiectoarele/lampile solare simple raman excluse mai jos,
         * pentru ca nu vrem orice LED in categoria 13.
         */
        if (isSmartLight(title, text)
                && !containsAny(title,
                "reflector led",
                "proiector led",
                "lampa solara",
                "reflector v-tac"
        )) {
            return false;
        }

        return containsAny(title,

                "cutie distributie",
                "sirena interior piezo",

                "hub usb",
                "hub usb-c",
                "usb hub",
                "adaptor usb 3.0 la gigabit",
                "ideahub",

                "panou frontal",
                "protectie videointerfon",
                "protectie ploaie",
                "cadru de montaj",
                "cadru montaj",
                "suport montaj videointerfon",
                "suport mobil pentru display",
                "accesoriu interfonie",
                "accesoriu supraveghere",

                "camera auto",
                "dash cam",
                "carcasa contact magnetic",
                "carcasa contact",
                "dispozitiv laser",
                "distribuitor de aerosoli",
                "detector tensiune",
                "detector metal",
                "detector lemn",

                /*
                 * Raman excluse. Nu sunt becuri smart.
                 */
                "proiector led",
                "reflector led",
                "lampa forever",
                "lampa solara",
                "reflector v-tac",

                "camera video 4k",
                "sport vision",

                "ecran interactiv",
                "display interactiv",
                "monitor interactiv",
                "whiteboard",

                "kit video-interfon, monitor tactil 7', 2 posturi exterioare",
                "kit video-interfon, monitor tactil 7 inch, 2 fire",
                "kit video-interfon 2 familii",
                "kit videointerfon, monitor tactil 7 inch, camera 2k",
                "kit videointerfon ip hikvision, camera 2mp ir",
                "panou exterior videointerfon tcp/ip pentru 1 familie, camera 2mp",
                "modul master pentru interfonie modulara",
                "modul master conectare 2 fire",
                "statie comunicare si control acces",

                "patch panel",
                "ups",
                "sursa neintreruptibila",
                "stabilizator",
                "electromagnet",
                "bolt electric",
                "multimetru",
                "telemetru",
                "lanterna cu acumulator",
                "acumulator gel",
                "cablu incendiu",
                "cablu alarma",
                "cablu cat",
                "mufa rj",
                "controler de incarcare pentru panou solar",

                "kit bariera auto",
                "bariera auto",
                "camera recunoastere placute",

                "kit montare in rack",
                "suport perete pentru access point",
                "suporti de montare pentru access point",
                "set 10 suporti de montare"
        );
    }

    private boolean hasStrongRelevantSignal(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;

        /*
         * 13 - BECURI SMART / iluminat smart.
         */
        if (isSmartLight(title, text)) {
            return true;
        }

        if (containsAny(title,
                "camera",
                "camera ip",
                "camera supraveghere",
                "camera de supraveghere",
                "ptz",
                "colorvu",
                "darkfighter",
                "acusense",
                "modul camera"
        )) {
            return true;
        }

        if (containsAny(title,
                "nvr",
                "xvr",
                "dvr"
        )) {
            return true;
        }

        if (containsAny(title,
                "detector",
                "senzor",
                "pir",
                "sirena",
                "buton alarmare",
                "tastatura wireless",
                "yala electrica"
        )) {
            return true;
        }

        if (containsAny(title,
                "monitor videointerfon",
                "monitor interfon",
                "monitor de interior",
                "modul afisaj",
                "afisaj",
                "videointerfon"
        )) {
            return true;
        }

        if (containsAny(title,
                "centrala",
                "centrala alarma",
                "centrala ax pro",
                "hub",
                "gateway",
                "bridge",
                "controler acces",
                "centrala de control acces",
                "transmitator io"
        )) {
            return true;
        }

        if (containsAny(title,
                "router",
                "router wireless",
                "router wifi",
                "router wi-fi",
                "mesh",
                "access point",
                "punct de acces"
        )) {
            return true;
        }

        if (containsAny(title,
                "priza smart",
                "priza inteligenta",
                "releu smart",
                "intrerupator smart",
                "smart plug"
        )) {
            return true;
        }

        if (containsAny(title,
                "difuzor ip",
                "difuzor poe",
                "speaker ip",
                "sistem audio",
                "soundbar",
                "boxa smart"
        )) {
            return true;
        }

        return containsAny(text,
                "camera ip",
                "poe",
                "onvif",
                "rtsp",
                "tcp/ip",
                "868mhz",
                "tri-x wireless",
                "power g",
                "control acces",
                "centrala ax pro",
                "detectie miscare",
                "detectie intrus"
        ) && containsAny(title,
                "camera",
                "detector",
                "centrala",
                "controler",
                "monitor",
                "interfon",
                "nvr",
                "xvr",
                "dvr",
                "router",
                "access point"
        );
    }

    private String extractBrand(StoreXmlItem item) {
        String titleUpper = safe(item.title).toUpperCase();
        String descriptionUpper = cleanText(item.description).toUpperCase();

        for (String brand : KNOWN_BRANDS) {
            if (titleUpper.contains(brand)) {
                return normalizeBrand(brand);
            }
        }

        String brandFromProducer = extractBrandAfterProducerLabel(descriptionUpper);

        if (!isBlank(brandFromProducer)) {
            return normalizeBrand(brandFromProducer);
        }

        for (String brand : KNOWN_BRANDS) {
            if (descriptionUpper.contains(brand)) {
                return normalizeBrand(brand);
            }
        }

        return "Generic";
    }

    private String extractBrandAfterProducerLabel(String descriptionUpper) {
        if (descriptionUpper == null) {
            return null;
        }

        List<String> labels = List.of(
                "PRODUCATOR:",
                "PRODUCATOR",
                "MODEL / PRODUCATOR:",
                "MODEL / PRODUCATOR",
                "MODEL/PRODUCATOR:",
                "MODEL/PRODUCATOR"
        );

        for (String label : labels) {
            int index = descriptionUpper.indexOf(label);

            if (index >= 0) {
                String afterLabel = descriptionUpper.substring(index + label.length()).trim();

                if (afterLabel.startsWith(":")) {
                    afterLabel = afterLabel.substring(1).trim();
                }

                String candidate = afterLabel.split("[\\s,;:/<>&]+")[0].trim();

                if (candidate.length() >= 2 && !candidate.equals("MODEL")) {
                    return candidate;
                }
            }
        }

        return null;
    }

    private String extractCommunicationProtocol(StoreXmlItem item) {
        String text = normalized(item.title + " " + item.description);

        if (containsAny(text, "zigbee")) {
            return "Zigbee";
        }

        if (containsAny(text, "z-wave", "zwave", "z wave")) {
            return "Z-Wave";
        }

        if (containsAny(text, "matter")) {
            return "Matter";
        }

        if (containsAny(text, "bluetooth", "blue tooth")) {
            return "Bluetooth";
        }

        if (containsAny(text, "wi-fi", "wifi", "ieee802.11")) {
            return "Wi-Fi";
        }

        if (containsAny(text, "868mhz", "868 mhz", "rf wireless", "tri-x", "power g", "powerg")) {
            return "RF 868MHz";
        }

        if (containsAny(text, "poe", "tcp/ip", "onvif", "rtsp", "ip camera", "camera ip", "ethernet", "rj45")) {
            return "IP";
        }

        return null;
    }

    private int smartScore(DeviceImportDto dto) {
        String text = normalized(dto.getName() + " " + dto.getDescription());

        int score = 0;

        if (containsAny(text, "smart")) {
            score += 10;
        }

        if (containsAny(text, "wi-fi", "wifi")) {
            score += 8;
        }

        if (containsAny(text, "zigbee", "matter", "z-wave", "zwave")) {
            score += 8;
        }

        if (containsAny(text, "poe", "onvif", "rtsp", "tcp/ip")) {
            score += 6;
        }

        if (containsAny(text, "wireless", "868mhz", "868 mhz", "tri-x", "power g")) {
            score += 6;
        }

        if (containsAny(text, "acusense", "colorvu", "darkfighter", "vca", "deep learning")) {
            score += 4;
        }

        if (containsAny(text, "bec", "banda led", "smart light strip", "yeelight", "philips hue", "nanoleaf")) {
            score += 3;
        }

        return score;
    }

    private String extractFirstImage(String imageUrls) {
        if (isBlank(imageUrls)) {
            return null;
        }

        String[] parts = imageUrls.split(",");

        if (parts.length == 0) {
            return null;
        }

        String firstImage = parts[0].trim();

        return firstImage.isEmpty() ? null : firstImage;
    }

    private String normalizeBrand(String value) {
        if (isBlank(value)) {
            return "Generic";
        }

        String brand = value.trim().toUpperCase();

        if (brand.equals("UNIVIEW")) {
            return "UNV";
        }

        if (brand.equals("TP-LINK")) {
            return "TP-Link";
        }

        if (brand.equals("HILOOK")) {
            return "HiLook";
        }

        if (brand.equals("YEELIGHT")) {
            return "Yeelight";
        }

        if (brand.equals("PHILIPS") || brand.equals("HUE")) {
            return "Philips Hue";
        }

        if (brand.equals("LEDVANCE")) {
            return "Ledvance";
        }

        if (brand.equals("OSRAM")) {
            return "Osram";
        }

        if (brand.equals("NANOLEAF")) {
            return "Nanoleaf";
        }

        if (brand.equals("SONOFF")) {
            return "Sonoff";
        }

        if (brand.equals("SHELLY")) {
            return "Shelly";
        }

        if (brand.equals("TELLUR")) {
            return "Tellur";
        }

        if (brand.equals("GOSUND")) {
            return "Gosund";
        }

        if (brand.equals("BROADLINK")) {
            return "BroadLink";
        }

        if (brand.equals("MEROSS")) {
            return "Meross";
        }

        if (brand.equals("XIAOMI")) {
            return "Xiaomi";
        }

        if (brand.equals("AQARA")) {
            return "Aqara";
        }

        return brand;
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null) {
            return false;
        }

        for (String keyword : keywords) {
            if (text.contains(normalized(keyword))) {
                return true;
            }
        }

        return false;
    }

    private String cleanText(String value) {
        if (value == null) {
            return null;
        }

        return value
                .replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("Â", "")
                .replaceAll("<[^>]*>", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalized(String value) {
        if (value == null) {
            return "";
        }

        String cleaned = cleanText(value);

        if (cleaned == null) {
            return "";
        }

        return cleaned
                .toLowerCase()
                .replace("ă", "a")
                .replace("â", "a")
                .replace("î", "i")
                .replace("ș", "s")
                .replace("ş", "s")
                .replace("ț", "t")
                .replace("ţ", "t")
                .replaceAll("[^a-z0-9+./ -]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}