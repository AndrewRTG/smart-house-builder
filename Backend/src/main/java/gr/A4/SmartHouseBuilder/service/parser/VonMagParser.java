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
public class VonMagParser implements StoreParser {

    private static final String STORE_NAME = "VONMAG";

    private static final List<String> KNOWN_BRANDS = List.of(
            "HIKVISION",
            "DAHUA",
            "UNV",
            "UNIVIEW",
            "IMOU",
            "EZVIZ",
            "REOLINK",
            "TP-LINK",
            "MERCUSYS",
            "TENDA",
            "TAPO",
            "SHELLY",
            "SONOFF",
            "NETATMO",
            "AJAX",
            "LEGRAND",
            "BTICINO",
            "WELAIK",
            "HUAWEI",
            "SCHNEIDER",
            "FINDER",
            "EATON",
            "ETI",
            "NOARK",
            "APC",
            "AMPEVO",
            "AMP EVO",
            "SCHRACK",
            "ELDON",
            "ELMARK",
            "ADELEQ",
            "SCAME",
            "OBO",
            "TANDA",
            "G-U",
            "HAGER",
            "NOUS",
            "BRENENSTUHL",
            "BRENNENSTUHL",
            "LEDVANCE",
            "OSRAM",
            "PHILIPS",
            "HUE",
            "YEELIGHT",
            "NANOLEAF",
            "MEROSS",
            "GOSUND",
            "NITEBIRD",
            "EVE",
            "WIZ",
            "GOVEE",
            "FIBARO",
            "AQARA",
            "XIAOMI",
            "BROADLINK",
            "GOOGLE",
            "AMAZON",
            "LIVOLO",
            "LUXION",
            "TELLUR",
            "ORVIBO",
            "SOMFY",
            "V-TAC",
            "VTAC",
            "KRUGER",
            "KRUGER&MATZ",
            "KRUGER MATZ"
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

                if (isVonMagAccessoryOrJunk(xmlItem)) {
                    continue;
                }

                Integer categoryId = determineVonMagCategoryId(xmlItem);

                if (categoryId == null) {
                    continue;
                }

                DeviceImportDto dto = convertToDto(xmlItem, categoryId);

                if (dto != null) {
                    devices.add(dto);
                }
            }

            devices.sort(Comparator.comparingInt(this::smartScore).reversed());

        } catch (Exception e) {
            System.out.println("Eroare la parsarea feed-ului VONMAG: " + e.getMessage());
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

    private Integer determineVonMagCategoryId(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;

        /*
         * 8 - Cazuri speciale care contin cuvantul "camera",
         * dar produsul principal este senzor/alarma.
         */
        if (containsAny(title,
                "senzori camera netatmo welcome tags",
                "detector wireless pir + camera",
                "detector pir + camera",
                "camera wifi pir dahua ard1731"
        )) {
            return 8;
        }

        /*
         * 6 - VIDEOINTERFOANE / panouri de apel video.
         */
        if (containsAny(title,
                "videointerfon",
                "video interfon",
                "post de interior video",
                "post interior video",
                "post exterior videointerfon",
                "panou exterior videointerfon",
                "panou de apel video",
                "panoul de apel video",
                "monitor videointerfon",
                "videointerfon ip"
        )) {
            return 6;
        }

        /*
         * 2 - PRELUNGITOARE SMART.
         * Trebuie verificat inainte de categoria 13,
         * fiindca unele prelungitoare smart contin termeni generali smart/wifi.
         */
        if (containsAny(title, "prelungitor")
                && containsAny(text,
                "smart",
                "wi-fi",
                "wifi",
                "control aplicatie",
                "aplicatie",
                "control de pe telefon",
                "tuya"
        )) {
            return 2;
        }

        /*
         * 4 - TERMOSTATE / ELECTROCASNICE SMART.
         */
        if (containsAny(title,
                "termostat smart",
                "termostat inteligent",
                "termostat bluetooth",
                "smart radiator thermostat",
                "tapo ke100",
                "netatmo home coach",
                "monitorizare calitatii aerului",
                "monitorizare calitate aer",
                "aparat de masurat calitatea aerului",
                "aparat masurare calitate aer",
                "gosund str1"
        )) {
            return 4;
        }

        /*
         * 5 - HUB-URI SMART / gateway-uri.
         */
        if (containsAny(title,
                "modul gateway",
                "smart gateway",
                "gateway emdx",
                "gateway cu netatmo",
                "gateway bluetooth",
                "gateway bluetooth ble",
                "wifi mesh inteligent cu alarma",
                "gosund g2",
                "ajax rex",
                "rex wh",
                "repetitor de semnal wireless"
        )) {
            return 5;
        }

        /*
         * 7 - PRIZE / INTRERUPATOARE / RELEE SMART.
         * Trebuie verificat inainte de categoria 13 ca sa nu intre prizele Gosund la becuri.
         */
        if (isSmartSwitchOrPlug(title, text)) {
            return 7;
        }

        /*
         * 8 - SENZORI SMART.
         * Trebuie verificat inainte de categoria 13 ca sa nu intre senzorii Gosund la becuri.
         */
        if (isSmartSensor(title, text)) {
            return 8;
        }

        /*
         * 13 - BECURI SMART / iluminat smart.
         */
        if (isSmartLight(title, text)) {
            return 13;
        }

        /*
         * 1 - CAMERE SMART.
         */
        if (isCamera(title, text)) {
            return 1;
        }

        /*
         * 12 - ROUTERE SMART / NETWORKING.
         */
        if (containsAny(title,
                "router wi-fi",
                "router wifi",
                "router wireless",
                "router 4g",
                "router 5g",
                "access point",
                "mesh wi-fi",
                "mesh wifi",
                "sistem mesh"
        )) {
            return 12;
        }

        return null;
    }

    private boolean isCamera(String title, String text) {
        if (containsAny(title,
                "camera auto",
                "camera de bord",
                "camera auto dvr",
                "dash cam",
                "ae-dc",
                "g-sensor",
                "adas",
                "camera inspectie",
                "endoscop",
                "terminal de control acces",
                "control acces ip",
                "doza conexiuni",
                "doza conexiuni camera",
                "detector wireless pir + camera",
                "detector pir + camera",
                "termostat camera"
        )) {
            return false;
        }

        if (containsAny(title,
                "camera ip",
                "camera wi-fi",
                "camera wifi",
                "camera smart",
                "camera termica",
                "camera colorvu",
                "camera hikvision",
                "camera dahua",
                "camera unv",
                "camera uniview",
                "camera imou",
                "camera ezviz",
                "camera reolink",
                "camera tp-link",
                "camera mercusys",
                "camera tenda",
                "camera smart netatmo",
                "camera supraveghere",
                "camera de supraveghere",
                "home security wi-fi camera",
                "pan/tilt home security wi-fi camera",
                "smart wire-free outdoor security camera",
                "smart wire-free securitycamera",
                "smart baby camera",
                "ajax video indoorcamera",
                "camera wifi ip smart floodlight"
        )) {
            return true;
        }

        return containsAny(title, "camera")
                && containsAny(text,
                "ip",
                "wi-fi",
                "wifi",
                "wireless",
                "poe",
                "h.265",
                "h265",
                "smart ir",
                "floodlight",
                "colorvu",
                "hikvision",
                "dahua",
                "unv",
                "uniview",
                "imou",
                "ezviz",
                "reolink",
                "netatmo",
                "tp-link",
                "mercusys",
                "tenda",
                "ajax",
                "gosund ipc"
        );
    }

    private boolean isSmartLight(String title, String text) {
        if (containsAny(title,
                "controller banda led",
                "controler banda led",
                "controller led",
                "controler led",
                "senzor smart touch dimabil pentru banda led",
                "senzor touch dimabil pentru banda led",
                "senzor smart touch",
                "dimmer pentru banda led",
                "dimmer banda led",
                "modul pentru banda led",
                "releu pentru banda led",
                "shelly rgbw2",
                "sonoff l2-c"
        )) {
            return false;
        }

        if (containsAny(title,
                "dvr",
                "nvr",
                "xvr",
                "wizsense",
                "speed dome",
                "spee dome",
                "detector de fum",
                "sonerie de incendiu"
        )) {
            return false;
        }

        if (containsAny(title,
                "priza",
                "prelungitor",
                "intrerupator",
                "comutator",
                "releu",
                "senzor",
                "termostat",
                "gateway",
                "camera"
        )) {
            return false;
        }

        return containsAny(title,
                "bec inteligent",
                "bec smart",
                "bec led smart",
                "bec led inteligent",
                "smart bulb",
                "banda led smart",
                "banda led inteligenta",
                "banda led rgb inteligenta",
                "banda led rgbic inteligenta",
                "smart light strip",
                "light strip smart",
                "kit banda led smart",
                "lampa smart",
                "lampa inteligenta",
                "lampa de veghe inteligenta",
                "lampa de veghe smart",
                "plafoniera smart",
                "plafoniera inteligenta",
                "plafoniera led inteligenta",
                "proiector stelar",
                "philips hue",
                "yeelight",
                "ledvance smart",
                "osram smart",
                "nanoleaf",
                "meross msl",
                "gosund lb",
                "nitebird",
                "eve light strip",
                "govee flow",
                "govee h605",
                "banda led rgb inteligenta starter kit",
                "bec led inteligent nous",
                "bec led rgb inteligent shelly",
                "bec led rgb inteligent philips hue",
                "bec led inteligent vintage",
                "bec led blu inteligent broadlink"
        ) || (
                containsAny(title,
                        "bec",
                        "banda led",
                        "lampa",
                        "plafoniera",
                        "light strip",
                        "led strip"
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
                        "homekit",
                        "tuya"
                )
        );
    }

    private boolean isSmartSwitchOrPlug(String title, String text) {
        if (containsAny(title,
                "priza inteligenta",
                "priza smart",
                "set 2 prize inteligente",
                "set 4 prize inteligente",
                "prize inteligente",
                "shelly plug",
                "smart plug"
        )) {
            return true;
        }

        if (containsAny(title,
                "intrerupator cu touch",
                "intrerupator simplu cu touch",
                "intrerupator dublu cu touch",
                "intrerupator triplu cu touch",
                "intrerupator smart",
                "intrerupator inteligent",
                "comutator inteligent",
                "tapo s200b",
                "tapo s200d",
                "welaik",
                "livolo",
                "luxion"
        ) && containsAny(text,
                "touch",
                "wi-fi",
                "wifi",
                "zigbee",
                "rf433",
                "rf 433",
                "wireless",
                "matter",
                "smart",
                "inteligent",
                "control aplicatie",
                "control de pe telefon",
                "bluetooth",
                "tuya"
        )) {
            return true;
        }

        if (containsAny(title,
                "releu inteligent",
                "releu smart",
                "shelly plus",
                "shelly 1",
                "shelly 1pm",
                "shelly 2.5",
                "sonoff thr",
                "sonoff pow",
                "sonoff mini",
                "sonoff 4ch",
                "nous b1z",
                "gosund sw3"
        )) {
            return true;
        }

        if (containsAny(title,
                "shelly blu button",
                "buton inteligent pentru actionarea dispozitivelor smart"
        )) {
            return true;
        }

        if (containsAny(title,
                "dimmer d1",
                "comutator inteligent cu dimmer"
        ) && containsAny(text,
                "wireless",
                "wi-fi",
                "wifi",
                "bluetooth",
                "control voce",
                "control aplicatie",
                "google home",
                "alexa"
        )) {
            return true;
        }

        if (containsAny(title,
                "mini intrerupator smart"
        )) {
            return true;
        }

        return false;
    }

    private boolean isSmartSensor(String title, String text) {
        if (containsAny(title,
                "senzor inteligent",
                "senzor wi-fi",
                "senzor wifi",
                "senzor zigbee",
                "senzor wireless",
                "senzor de miscare",
                "senzor miscare",
                "senzor usa",
                "senzor usi",
                "senzor usa / fereastra",
                "senzor pentru usa",
                "senzor pentru usi",
                "senzor temperatura",
                "senzor de temperatura",
                "senzor inundatie",
                "senzor de inundatie",
                "senzor gaz",
                "senzor de gaz",
                "senzor fum",
                "senzor de fum",
                "senzor de prezenta",
                "senzor de prezenta umana",
                "senzor inteligent de deschidere",
                "detector smart",
                "detector wi-fi",
                "detector wifi",
                "detector wireless",
                "detector zigbee"
        )) {
            return containsAny(text,
                    "smart",
                    "wi-fi",
                    "wifi",
                    "wireless",
                    "zigbee",
                    "z-wave",
                    "zwave",
                    "ajax",
                    "shelly",
                    "sonoff",
                    "netatmo",
                    "tapo",
                    "aqara",
                    "somfy",
                    "orvibo",
                    "tellur",
                    "luxion",
                    "gosund",
                    "tuya",
                    "aplicatie",
                    "control"
            );
        }

        if (containsAny(title,
                "ajax motionprotect",
                "ajax doorprotect",
                "ajax fireprotect",
                "ajax leaksprotect",
                "ajax glassprotect",
                "ajax spacecontrol",
                "ajax button"
        )) {
            return true;
        }

        if (containsAny(title,
                "tapo t310",
                "tapo t315",
                "aqara fp1e",
                "sonoff snzb-06p",
                "sonoff snzb-02d",
                "sonoff snzb-02wd",
                "gosund st18",
                "gosund st19",
                "gosund st20"
        )) {
            return true;
        }

        return false;
    }

    private boolean isVonMagAccessoryOrJunk(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;

        /*
         * Daca este bec/banda/lampa smart, nu o eliminam ca junk.
         */
        if (isSmartLight(title, text)) {
            return false;
        }

        if (containsAny(title,
                "statie incarcare",
                "statie incarcat",
                "smart charger",
                "vehicule electrice",
                "masini electrice",
                "sistem fotovoltaic",
                "panou fotovoltaic",
                "invertor",
                "smart dongle"
        )) {
            return true;
        }

        if (containsAny(title,
                "camera auto",
                "camera de bord",
                "camera auto dvr",
                "dash cam",
                "ae-dc",
                "g-sensor",
                "adas",
                "camera inspectie",
                "endoscop",
                "terminal de control acces",
                "control acces ip",
                "doza conexiuni",
                "doza conexiuni camera",
                "termostat camera",
                "camera video 4k",
                "sport vision"
        )) {
            return true;
        }

        /*
         * Produse LED / iluminat nesmart sau industrial.
         */
        if (containsAny(title,
                "reflector led",
                "proiector led",
                "lampa led",
                "corp iluminat",
                "lampa perete led",
                "lampa led cu senzor"
        ) && !isSmartLight(title, text)) {
            return true;
        }

        /*
         * Becurile/benzile LED simple, fara semnal smart, nu se importa.
         */
        if (containsAny(title,
                "bec led",
                "banda led",
                "light strip",
                "led strip"
        ) && !isSmartLight(title, text)) {
            return true;
        }

        if (containsAny(title,
                "detector tensiune",
                "detector tensiune/metal/lemn",
                "detector metal",
                "detector lemn",
                "electromagnet",
                "kit senzori de parcare",
                "senzori de parcare",
                "termostat lcd senzor",
                "carcasa pentru detector",
                "carcasa detector"
        )) {
            return true;
        }

        if (containsAny(title,
                "protectie de ploaie",
                "protectie pentru ploaie",
                "protectie ploaie",
                "protectie post exterior videointerfon",
                "panou frontal pentru",
                "modul cititor de card",
                "modul cititor card",
                "modul de afisare",
                "modul indicator de stare"
        )) {
            return true;
        }

        if (containsAny(title,
                "prelungitor pentru perete/colt"
        )) {
            return true;
        }

        if (containsAny(title,
                "ups",
                "smart-ups",
                "acumulator",
                "baterie",
                "kit incarcator",
                "redresor auto"
        )) {
            return true;
        }

        if (containsAny(title,
                "shelly bypass",
                "bypass shelly",
                "shelly plus add-on",
                "shelly add-on"
        )) {
            return true;
        }

        if (containsAny(title,
                "transformator",
                "contactor",
                "bobina",
                "mccb",
                "rccb",
                "rcbo",
                "intrerupator automat",
                "intrerupator de putere",
                "intrerupator mccb",
                "intrerupator rccb",
                "separator",
                "separator de sarcina",
                "descarcator",
                "paratraznet",
                "siguranta",
                "tablou electric",
                "dulap",
                "bloc distributie",
                "clema",
                "morseta",
                "bara",
                "banda metalica",
                "canal cablu",
                "cablu",
                "rola cablu",
                "conductor",
                "doza",
                "suport",
                "adaptor",
                "set adaptoare",
                "rama",
                "tasta",
                "capac",
                "modul suport",
                "priza pe sina din",
                "automat de scara"
        )) {
            return !isCamera(title, text);
        }

        if (containsAny(title,
                "releu de timp",
                "releul de timp",
                "releu control",
                "releu de control",
                "releu monofazat",
                "releu multifunctional",
                "releu de supraveghere",
                "harmony control relays",
                "current control relay",
                "voltage control relay"
        )) {
            return !isSmartSwitchOrPlug(title, text);
        }

        if (containsAny(title,
                "detector conventional",
                "bariera optica de fum",
                "detector incendiu conventional",
                "detector optic conventional"
        )) {
            return true;
        }

        if (containsAny(title,
                "detector pir cablat",
                "detector de miscare pir cablat",
                "detector optic de fum",
                "detector adresabil",
                "adresabil mx",
                "contact magnetic",
                "detector geam spart",
                "detector de taiere",
                "detector de miscare digital",
                "paradox",
                "dsc lc-",
                "dsc mx",
                "cofem",
                "sensoiris",
                "sensomag"
        ) && !containsAny(title,
                "wireless",
                "wi-fi",
                "wifi",
                "zigbee",
                "smart",
                "inteligent",
                "ajax",
                "sonoff",
                "shelly",
                "tellur",
                "orvibo",
                "luxion",
                "tahoma",
                "somfy"
        )) {
            return true;
        }

        if (containsAny(title, "prelungitor")
                && !containsAny(text,
                "smart",
                "wi-fi",
                "wifi",
                "control aplicatie",
                "aplicatie",
                "control de pe telefon",
                "tuya"
        )) {
            return true;
        }

        if (containsAny(title, "priza")
                && !containsAny(text,
                "smart",
                "inteligenta",
                "wi-fi",
                "wifi",
                "wireless",
                "zigbee",
                "shelly",
                "tapo",
                "gosund",
                "tuya",
                "control aplicatie",
                "aplicatie",
                "control de pe telefon"
        )) {
            return true;
        }

        if (containsAny(title, "intrerupator")
                && !isSmartSwitchOrPlug(title, text)
                && !containsAny(title,
                "touch",
                "wi-fi",
                "wifi",
                "zigbee",
                "smart",
                "inteligent",
                "welaik",
                "shelly",
                "sonoff",
                "livolo",
                "luxion",
                "gosund",
                "rf433",
                "wireless",
                "matter"
        )) {
            return true;
        }

        return false;
    }

    private DeviceImportDto convertToDto(StoreXmlItem xmlItem, Integer categoryId) {
        DeviceImportDto dto = new DeviceImportDto();

        dto.setName(cleanText(xmlItem.title));
        dto.setPrice(xmlItem.price);
        dto.setDescription(cleanText(xmlItem.description));
        dto.setSourceStore(STORE_NAME);
        dto.setProductUrl(cleanText(xmlItem.affCode));
        dto.setImageUrl(extractFirstImage(xmlItem.imageUrls));
        dto.setBrand(extractBrand(xmlItem));
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

    private String extractBrand(StoreXmlItem item) {
        String title = cleanText(item.title);
        String description = cleanText(item.description);

        String titleUpper = safe(title).toUpperCase();
        String descriptionUpper = safe(description).toUpperCase();

        String brandFromDescription = extractBrandAfterLabel(descriptionUpper);

        if (!isBlank(brandFromDescription)) {
            return normalizeBrand(brandFromDescription);
        }

        for (String brand : KNOWN_BRANDS) {
            if (titleUpper.contains(brand)) {
                return normalizeBrand(brand);
            }
        }

        for (String brand : KNOWN_BRANDS) {
            if (descriptionUpper.contains(brand)) {
                return normalizeBrand(brand);
            }
        }

        String brandFromTitleEnd = extractBrandFromTitleEnd(titleUpper);

        if (!isBlank(brandFromTitleEnd)) {
            return normalizeBrand(brandFromTitleEnd);
        }

        return "Generic";
    }

    private String extractBrandAfterLabel(String descriptionUpper) {
        if (descriptionUpper == null) {
            return null;
        }

        List<String> labels = List.of(
                "PRODUCATOR:",
                "PRODUCĂTOR:",
                "BRAND:",
                "BRAND :",
                "MARCA:"
        );

        for (String label : labels) {
            int index = descriptionUpper.indexOf(label);

            if (index >= 0) {
                String afterLabel = descriptionUpper.substring(index + label.length()).trim();

                if (afterLabel.startsWith(":")) {
                    afterLabel = afterLabel.substring(1).trim();
                }

                String candidate = afterLabel.split("[\\s,;:/<>&]+")[0].trim();

                if (candidate.length() >= 2) {
                    return candidate;
                }
            }
        }

        return null;
    }

    private String extractBrandFromTitleEnd(String titleUpper) {
        if (isBlank(titleUpper)) {
            return null;
        }

        String[] words = titleUpper
                .replaceAll("[^A-Z0-9\\- ]", " ")
                .replaceAll("\\s+", " ")
                .trim()
                .split(" ");

        if (words.length < 2) {
            return null;
        }

        for (int i = words.length - 1; i >= 0; i--) {
            String word = words[i];

            if (word.length() < 2) {
                continue;
            }

            if (word.matches(".*\\d.*")) {
                continue;
            }

            if (word.matches("[A-Z\\-]+")) {
                return word;
            }
        }

        return null;
    }

    private String extractCommunicationProtocol(StoreXmlItem item) {
        String text = normalized(item.title + " " + item.description);

        if (containsAny(text, "zigbee")) {
            return "Zigbee";
        }

        if (containsAny(text, "matter")) {
            return "Matter";
        }

        if (containsAny(text, "z-wave", "zwave", "z wave")) {
            return "Z-Wave";
        }

        if (containsAny(text, "bluetooth")) {
            return "Bluetooth";
        }

        if (containsAny(text, "wi-fi", "wifi", "ieee 802.11", "ieee802.11")) {
            return "Wi-Fi";
        }

        if (containsAny(text, "lan")) {
            return "LAN";
        }

        if (containsAny(text, "rf433", "433mhz", "433 mhz")) {
            return "RF 433MHz";
        }

        if (containsAny(text, "868mhz", "868 mhz")) {
            return "RF 868MHz";
        }

        if (containsAny(text, "wireless")) {
            return "Wireless";
        }

        if (containsAny(text, "touch")) {
            return "Touch";
        }

        return null;
    }

    private int smartScore(DeviceImportDto dto) {
        String text = normalized(dto.getName() + " " + dto.getDescription());

        int score = 0;

        if (containsAny(text, "smart", "inteligent", "inteligenta")) {
            score += 10;
        }

        if (containsAny(text, "wi-fi", "wifi")) {
            score += 8;
        }

        if (containsAny(text, "zigbee", "z-wave", "zwave", "matter")) {
            score += 8;
        }

        if (containsAny(text, "wireless")) {
            score += 6;
        }

        if (containsAny(text, "control aplicatie", "aplicatie mobila", "control de pe telefon", "tuya")) {
            score += 6;
        }

        if (containsAny(text, "touch")) {
            score += 4;
        }

        if (containsAny(text,
                "bec",
                "banda led",
                "smart light strip",
                "light strip",
                "yeelight",
                "philips hue",
                "nanoleaf",
                "meross",
                "gosund",
                "nitebird",
                "wiz",
                "govee"
        )) {
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

        if (brand.equals("TP-LINK")) return "TP-Link";
        if (brand.equals("UNV")) return "UNV";
        if (brand.equals("UNIVIEW")) return "Uniview";
        if (brand.equals("HIKVISION")) return "Hikvision";
        if (brand.equals("DAHUA")) return "Dahua";
        if (brand.equals("IMOU")) return "Imou";
        if (brand.equals("EZVIZ")) return "Ezviz";
        if (brand.equals("REOLINK")) return "Reolink";
        if (brand.equals("MERCUSYS")) return "Mercusys";
        if (brand.equals("TENDA")) return "Tenda";
        if (brand.equals("SHELLY")) return "Shelly";
        if (brand.equals("SONOFF")) return "Sonoff";
        if (brand.equals("NETATMO")) return "Netatmo";
        if (brand.equals("AJAX")) return "Ajax";
        if (brand.equals("LEGRAND")) return "Legrand";
        if (brand.equals("BTICINO")) return "Bticino";
        if (brand.equals("WELAIK")) return "Welaik";
        if (brand.equals("HUAWEI")) return "Huawei";
        if (brand.equals("SCHNEIDER")) return "Schneider";
        if (brand.equals("FINDER")) return "Finder";
        if (brand.equals("EATON")) return "Eaton";
        if (brand.equals("ETI")) return "ETI";
        if (brand.equals("NOARK")) return "Noark";
        if (brand.equals("APC")) return "APC";
        if (brand.equals("SCHRACK")) return "Schrack";
        if (brand.equals("ELDON")) return "Eldon";
        if (brand.equals("ELMARK")) return "Elmark";
        if (brand.equals("ADELEQ")) return "Adeleq";
        if (brand.equals("SCAME")) return "Scame";
        if (brand.equals("OBO")) return "OBO";
        if (brand.equals("TANDA")) return "Tanda";
        if (brand.equals("G-U")) return "G-U";
        if (brand.equals("HAGER")) return "Hager";
        if (brand.equals("AMPEVO") || brand.equals("AMP EVO")) return "Ampevo";
        if (brand.equals("NOUS")) return "Nous";
        if (brand.equals("BRENNENSTUHL") || brand.equals("BRENENSTUHL")) return "Brennenstuhl";
        if (brand.equals("LEDVANCE")) return "Ledvance";
        if (brand.equals("OSRAM")) return "Osram";
        if (brand.equals("PHILIPS")) return "Philips";
        if (brand.equals("HUE")) return "Philips Hue";
        if (brand.equals("YEELIGHT")) return "Yeelight";
        if (brand.equals("NANOLEAF")) return "Nanoleaf";
        if (brand.equals("MEROSS")) return "Meross";
        if (brand.equals("GOSUND")) return "Gosund";
        if (brand.equals("NITEBIRD")) return "NiteBird";
        if (brand.equals("EVE")) return "Eve";
        if (brand.equals("WIZ")) return "Wiz";
        if (brand.equals("GOVEE")) return "Govee";
        if (brand.equals("FIBARO")) return "Fibaro";
        if (brand.equals("AQARA")) return "Aqara";
        if (brand.equals("XIAOMI")) return "Xiaomi";
        if (brand.equals("BROADLINK")) return "BroadLink";
        if (brand.equals("GOOGLE")) return "Google";
        if (brand.equals("AMAZON")) return "Amazon";
        if (brand.equals("LIVOLO")) return "Livolo";
        if (brand.equals("LUXION")) return "Luxion";
        if (brand.equals("TELLUR")) return "Tellur";
        if (brand.equals("ORVIBO")) return "Orvibo";
        if (brand.equals("SOMFY")) return "Somfy";
        if (brand.equals("VTAC") || brand.equals("V-TAC")) return "V-TAC";
        if (brand.equals("KRUGER") || brand.equals("KRUGER&MATZ") || brand.equals("KRUGER MATZ")) return "Kruger&Matz";

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
                .replace("&#8211;", "-")
                .replace("&#038;", "&")
                .replace("&#8243;", "\"")
                .replace("&quot;", "\"")
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