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
public class CaseSmartParser implements StoreParser {

    private static final String STORE_NAME = "CASESMART";

    private static final List<String> KNOWN_BRANDS = List.of(
            "LIVOLO",
            "LUXION",
            "AQARA",
            "XIAOMI",
            "TP-LINK",
            "TAPO",
            "SONOFF",
            "SHELLY",
            "TUYA",
            "BROADLINK",
            "GOOGLE",
            "AMAZON",
            "EZVIZ",
            "IMOU",
            "ORVIBO",
            "TELLUR",
            "GOSUND",
            "REDSUN",
            "SOMFY",
            "NETATMO",
            "LEVOIT",
            "SENSIBO",
            "COMPUTHERM",
            "KYVOL",
            "BLITZWOLF",
            "NANOLEAF",
            "PHILIPS",
            "HUE",
            "YEELIGHT",
            "LEDVANCE",
            "OSRAM"
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

                if (isCaseSmartAccessoryOrJunk(xmlItem)) {
                    continue;
                }

                Integer categoryId = determineCaseSmartCategoryId(xmlItem);

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
            System.out.println("Eroare la parsarea feed-ului CASESMART: " + e.getMessage());
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

    private Integer determineCaseSmartCategoryId(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;



        if (containsAny(title,
                "camera de supraveghere",
                "camera inteligenta",
                "camera smart",
                "camera ip"
        )) {
            return 1;
        }

        if (containsAny(title,
                "purificator de aer",
                "termostat smart",
                "termostat inteligent",
                "termostat computherm",
                "sensibo sky"
        )) {
            return 4;
        }

        if (containsAny(title,
                "broadlink hub",
                "hub rm4",
                "mini hub",
                "kit sistem de securitate",
                "sistem de alarma broadlink",
                "bestcon msk1",
                "orvibo mixpad",
                "panou multifunctional smart"
        )) {
            return 5;
        }

        /*
         * 13 - BECURI SMART / iluminat smart.
         * Trebuie pus inainte de prize/intrerupatoare, ca sa nu ajunga gresit la 7.
         */
        if (isSmartLight(title, text)) {
            return 13;
        }

        if (isTouchSwitch(title, text)) {
            return 7;
        }

        if (isSmartPlug(title, text)) {
            return 7;
        }

        return CategoryMapper.determineCategoryId(
                item.title,
                item.description
        );
    }

    private boolean isSmartLight(String title, String text) {
        return containsAny(title,
                "bec inteligent",
                "bec smart",
                "bec led smart",
                "banda led smart",
                "kit banda led",
                "panouri luminoase",
                "panouri luminoase inteligente",
                "nanoleaf",
                "lampa smart",
                "lampa inteligenta",
                "philips hue",
                "yeelight",
                "ledvance smart",
                "osram smart"
        ) || (
                containsAny(title,
                        "bec",
                        "banda led",
                        "lampa",
                        "panou luminos",
                        "panouri luminoase"
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
                        "google home",
                        "alexa"
                )
        );
    }

    private boolean isTouchSwitch(String title, String text) {
        if (!containsAny(title,
                "intrerupator",
                "variator",
                "dimmer",
                "buton sonerie",
                "comutator"
        )) {
            return false;
        }

        return containsAny(text,
                "touch",
                "atingere",
                "wireless",
                "wi-fi",
                "wifi",
                "zigbee",
                "rf433",
                "rf 433",
                "smart",
                "timer",
                "variator",
                "dimmer",
                "control aplicatie",
                "control de pe telefon"
        );
    }

    private boolean isSmartPlug(String title, String text) {
        if (!containsAny(title, "priza")) {
            return false;
        }

        return containsAny(text,
                "smart",
                "inteligenta",
                "wi-fi",
                "wifi",
                "wireless",
                "zigbee",
                "z-wave",
                "zwave",
                "matter",
                "control aplicatie",
                "control de pe telefon",
                "aplicatie",
                "monitorizare consum",
                "monitorizare energie",
                "consum energie",
                "compatibil alexa",
                "google home"
        );
    }

    private boolean isCaseSmartAccessoryOrJunk(StoreXmlItem item) {
        String title = normalized(item.title);
        String description = normalized(item.description);
        String text = title + " " + description;

        if (containsAny(title,
                "releu",
                "relee"
        )) {
            return true;
        }

        if (containsAny(title,
                "intrerupator mecanic",
                "modul intrerupator mecanic",
                "comutator pentru ventilator",
                "variator mecanic"
        )) {
            return true;
        }

        if (containsAny(title,
                "filtru de rezerva pentru purificator"
        )) {
            return true;
        }

        /*
         * Produse fara categorie in aplicatia noastra.
         * Becurile / benzile LED / Nanoleaf NU se mai elimina,
         * fiindca acum avem categoria 13.
         */
        if (containsAny(title,
                "oglinda cosmetica",
                "recuperator de caldura"
        )) {
            return true;
        }

        if (containsAny(title,
                "bypass shelly",
                "telecomanda tip breloc",
                "telecomanda",
                "breloc"
        )) {
            return true;
        }

        if (containsAny(title,
                "priza dubla telefon",
                "priza telefon",
                "priza dubla internet",
                "priza internet",
                "priza dubla tv",
                "priza tv",
                "priza televizor",
                "priza dubla televizor",
                "priza hdmi",
                "priza audio",
                "priza rj45",
                "priza date",
                "priza calculator",
                "priza cat6",
                "priza cat 6"
        )) {
            return true;
        }

        if (containsAny(title,
                "priza simpla livolo",
                "priza dubla livolo",
                "priza tripla livolo",
                "priza cvadrupla livolo",
                "priza simpla luxion",
                "priza dubla luxion"
        ) && !containsAny(title,
                "smart",
                "inteligenta",
                "wi-fi",
                "wifi",
                "wireless",
                "zigbee",
                "control de pe telefon",
                "control aplicatie"
        )) {
            return true;
        }
        if (containsAny(title,
                "incarcator wireless",
                "telcomanda inteligenta yeelight",
                "telecomanda inteligenta yeelight",
                "comutator inteligent cu dimmer yeelight",
                "nanoleaf lines skin",
                "extensie banda led 2m",
                "extensie banda led 5m",
                "umidificator cu ultrasunete",
                "boxa si lampa",
                "boxa bluetooth cu lampa",
                "boxa portabila red sun",
                "boxa portabila si lampa"
        )) {
            return true;
        }
        if (containsAny(title,
                "rama",
                "rama din sticla",
                "rama sticla",
                "panou sticla",
                "panou din sticla",
                "doza",
                "doza montaj",
                "suport",
                "adaptor",
                "cablu",
                "conector",
                "modul receptor",
                "receptor wireless",
                "receptor radio",
                "capac",
                "sursa",
                "alimentator",
                "baterie",
                "acumulator",
                "set suruburi"
        )) {
            return !containsAny(title,
                    "intrerupator",
                    "variator",
                    "dimmer",
                    "buton sonerie",
                    "comutator"
            );
        }

        /*
         * Iluminat simplu, nesmart.
         * Daca este bec/banda/panou/lampa smart, nu se elimina si merge la categoria 13.
         */
        if (containsAny(title,
                "bec",
                "banda led",
                "lampa",
                "lustra",
                "aplica",
                "spot led",
                "proiector led"
        ) && !isSmartLight(title, text)) {
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
        String titleUpper = safe(item.title).toUpperCase();
        String descriptionUpper = cleanText(item.description).toUpperCase();

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

        return "Generic";
    }

    private String extractBrandAfterLabel(String descriptionUpper) {
        if (descriptionUpper == null) {
            return null;
        }

        List<String> labels = List.of(
                "BRAND :",
                "BRAND:",
                "BRAND"
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

        if (containsAny(text, "rf433", "rf 433", "433mhz", "433 mhz")) {
            return "RF 433MHz";
        }

        if (containsAny(text, "868mhz", "868 mhz")) {
            return "RF 868MHz";
        }

        if (containsAny(text, "wireless")) {
            return "Wireless";
        }

        if (containsAny(text, "touch", "atingere")) {
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

        if (containsAny(text, "zigbee", "matter", "z-wave", "zwave")) {
            score += 8;
        }

        if (containsAny(text, "wireless", "rf433", "rf 433", "433mhz", "433 mhz", "868mhz", "868 mhz")) {
            score += 6;
        }

        if (containsAny(text, "control aplicatie", "control de pe telefon")) {
            score += 6;
        }

        if (containsAny(text, "touch", "atingere")) {
            score += 4;
        }

        if (containsAny(text, "livolo", "luxion")) {
            score += 3;
        }

        if (containsAny(text, "bec", "banda led", "nanoleaf", "philips hue", "yeelight")) {
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
        if (brand.equals("LIVOLO")) return "Livolo";
        if (brand.equals("LUXION")) return "Luxion";
        if (brand.equals("SONOFF")) return "Sonoff";
        if (brand.equals("SHELLY")) return "Shelly";
        if (brand.equals("AQARA")) return "Aqara";
        if (brand.equals("XIAOMI")) return "Xiaomi";
        if (brand.equals("BROADLINK")) return "BroadLink";
        if (brand.equals("ORVIBO")) return "Orvibo";
        if (brand.equals("TELLUR")) return "Tellur";
        if (brand.equals("GOSUND")) return "Gosund";
        if (brand.equals("REDSUN")) return "RedSun";
        if (brand.equals("SOMFY")) return "Somfy";
        if (brand.equals("NETATMO")) return "Netatmo";
        if (brand.equals("LEVOIT")) return "Levoit";
        if (brand.equals("SENSIBO")) return "Sensibo";
        if (brand.equals("COMPUTHERM")) return "Computherm";
        if (brand.equals("KYVOL")) return "Kyvol";
        if (brand.equals("BLITZWOLF")) return "BlitzWolf";
        if (brand.equals("NANOLEAF")) return "Nanoleaf";
        if (brand.equals("PHILIPS")) return "Philips";
        if (brand.equals("HUE")) return "Philips Hue";
        if (brand.equals("YEELIGHT")) return "Yeelight";
        if (brand.equals("LEDVANCE")) return "Ledvance";
        if (brand.equals("OSRAM")) return "Osram";

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