package gr.A4.SmartHouseBuilder.service.parser;

public class CategoryMapper {

    public static Integer determineCategoryId(String title, String description) {
        String t = normalize(title);
        String d = normalize(description);
        String all = t + " " + d;

        if (isBlank(t)) {
            return null;
        }

        if (isExcludedProduct(t)) {
            return null;
        }

        if (matchesAnyWord(t, "nvr", "dvr", "xvr")) {
            return null;
        }

        if (containsAny(t,
                "bec smart",
                "bec inteligent",
                "becuri smart",
                "becuri inteligente",
                "smart bulb",
                "lampa smart",
                "lampa inteligenta",
                "banda led smart",
                "banda led inteligenta",
                "smart light strip",
                "light strip smart",
                "led strip smart",
                "nanoleaf",
                "panouri luminoase inteligente",
                "proiector smart",
                "spot smart",
                "lustra smart",
                "iluminat smart"
        )) {
            return 13;
        }

        if (containsAny(t,
                "detector",
                "senzor",
                "contact magnetic",
                "contact wireless",
                "sirena wireless",
                "buton de urgenta",
                "buton panica",
                "buton alarmare",
                "tastatura wireless",
                "detector pir",
                "detector fum",
                "detector gaz",
                "detector inundatie",
                "detector temperatura",
                "detector miscare"
        )) {
            return 8;
        }

        if (
                containsAny(t,
                        "camera supraveghere",
                        "camera de supraveghere",
                        "camera ip",
                        "camera wi-fi",
                        "camera wifi",
                        "camera wireless",
                        "camera colorvu",
                        "camera ptz",
                        "camera hikvision",
                        "camera dahua",
                        "camera ezviz",
                        "camera imou",
                        "camera reolink"
                )
                        ||
                        (
                                containsWord(t, "camera")
                                        && containsAny(t,
                                        "ip",
                                        "wi-fi",
                                        "wifi",
                                        "wireless",
                                        "poe",
                                        "ptz",
                                        "colorvu",
                                        "darkfighter",
                                        "acusense",
                                        "smart ir",
                                        "full color"
                                )
                        )
                        ||
                        (
                                containsAny(t, "kit supraveghere", "sistem supraveghere", "sistem de supraveghere")
                                        && containsWord(t, "camera")
                        )
        ) {
            return 1;
        }

        if (
                containsAny(t,
                        "prelungitor smart",
                        "prelungitor inteligent",
                        "smart power strip",
                        "power strip wi-fi",
                        "power strip wifi"
                )
                        ||
                        (
                                containsWord(t, "prelungitor")
                                        && containsAny(t, "smart", "wi-fi", "wifi")
                        )
        ) {
            return 2;
        }


        if (containsAny(t,
                "playstation",
                "ps5",
                "ps4",
                "xbox",
                "nintendo switch",
                "consola gaming",
                "consola jocuri"
        )) {
            return 3;
        }


        if (
                containsAny(t,
                        "frigider smart",
                        "masina de spalat smart",
                        "cuptor smart",
                        "aer conditionat smart",
                        "purificator aer smart",
                        "purificator de aer smart",
                        "smart air purifier"
                )
                        ||
                        (
                                containsAny(t,
                                        "purificator aer",
                                        "purificator de aer",
                                        "termostat inteligent",
                                        "termostat smart"
                                )
                                        && containsAny(t, "wi-fi", "wifi", "zigbee", "smart")
                        )
        ) {
            return 4;
        }


        if (
                containsAny(t,
                        "hub smart",
                        "smart hub",
                        "gateway smart",
                        "home gateway smart",
                        "aqara hub",
                        "tapo h100",
                        "tapo h200"
                )
                        ||
                        (
                                containsAny(t, "centrala alarma", "centrala de alarma", "centrala efractie", "centrala ax pro")
                                        && containsAny(all, "wireless", "868mhz", "wi-fi", "wifi", "tcp/ip", "smart home", "smarthome")
                        )
        ) {
            return 5;
        }


        if (containsAny(t,
                "monitor videointerfon",
                "monitor interfon",
                "monitor de interior",
                "kit videointerfon",
                "videointerfon",
                "post exterior videointerfon",
                "panou exterior videointerfon",
                "modul afisaj"
        )) {
            return 6;
        }


        if (
                containsAny(t,
                        "priza smart",
                        "priza inteligenta",
                        "priza wi-fi",
                        "priza wifi",
                        "smart plug",
                        "socket smart"
                )
                        ||
                        (
                                containsAny(t,
                                        "releu inteligent",
                                        "releu smart",
                                        "intrerupator inteligent",
                                        "intrerupator smart"
                                )
                                        && containsAny(t, "wi-fi", "wifi", "868mhz", "tapo", "ezviz", "smart")
                        )
        ) {
            return 7;
        }


        if (
                containsAny(t,
                        "soundbar",
                        "boxa smart",
                        "boxa inteligenta",
                        "speaker smart",
                        "sistem audio"
                )
                        ||
                        (
                                containsAny(t, "difuzor ip", "difuzor poe", "difuzor bluetooth", "difuzor analog")
                                        && !containsAny(t, "camera", "terminal", "control acces", "ecran interactiv")
                        )
        ) {
            return 9;
        }


        if (containsAny(t,
                "smart tv",
                "televizor smart",
                "android tv",
                "google tv"
        )) {
            return 10;
        }


        if (containsAny(t,
                "aspirator robot",
                "robot aspirator",
                "robot vacuum",
                "roborock",
                "irobot",
                "dreame"
        )) {
            return 11;
        }

        if (
                containsAny(t,
                        "router",
                        "router wireless",
                        "router wi-fi",
                        "router wifi",
                        "sistem mesh",
                        "mesh wi-fi",
                        "mesh wifi",
                        "access point",
                        "punct de acces",
                        "bridge wireless",
                        "ap-bridge"
                )
                        &&
                        !containsAny(t,
                                "switch",
                                "cloud router switch",
                                "range extender",
                                "extender",
                                "modul sfp",
                                "licenta"
                        )
        ) {
            return 12;
        }

        return null;
    }

    public static Integer determineCategoryId(String title) {
        return determineCategoryId(title, null);
    }

    private static boolean isExcludedProduct(String t) {

        if (containsAny(t,
                "accesoriu",
                "suport",
                "rama",
                "soclu",
                "doza",
                "cablu",
                "mufa",
                "conector",
                "adaptor",
                "alimentator",
                "sursa alimentare",
                "sursa neintreruptibila",
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
                "cutie modulara",
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
                "modul sfp",
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
                "limitator",
                "tag",
                "card mifare",
                "cartela",
                "telecomanda",
                "set montaj",
                "kit montaj",
                "ups",
                "pdu",
                "antena",
                "licenta"
        )) {

            return !containsAny(t,
                    "camera supraveghere",
                    "camera de supraveghere",
                    "camera ip",
                    "camera wi-fi",
                    "camera wifi",
                    "camera ptz"
            );
        }

        if (containsAny(t,
                "hub usb",
                "hub usb-c",
                "usb hub",
                "ideahub"
        )) {
            return true;
        }

        if (containsAny(t,
                "switch poe",
                "switch gigabit",
                "switch 10g",
                "switch 16",
                "switch 24",
                "cloud router switch"
        )) {
            return true;
        }

        if (containsWord(t, "prelungitor")
                && !containsAny(t, "smart", "wi-fi", "wifi", "power strip")) {
            return true;
        }

        return false;
    }

    private static boolean containsAny(String text, String... keywords) {
        if (text == null) {
            return false;
        }

        for (String keyword : keywords) {
            if (text.contains(normalize(keyword))) {
                return true;
            }
        }

        return false;
    }

    private static boolean containsWord(String text, String word) {
        if (text == null || word == null) {
            return false;
        }

        String normalizedWord = normalize(word);
        return text.matches(".*\\b" + java.util.regex.Pattern.quote(normalizedWord) + "\\b.*");
    }

    private static boolean matchesAnyWord(String text, String... words) {
        for (String word : words) {
            if (containsWord(text, word)) {
                return true;
            }
        }

        return false;
    }

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }

        return value.toLowerCase()
                .replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("Â", " ")
                .replace("ă", "a")
                .replace("â", "a")
                .replace("î", "i")
                .replace("ș", "s")
                .replace("ş", "s")
                .replace("ț", "t")
                .replace("ţ", "t")
                .replaceAll("<[^>]*>", " ")
                .replaceAll("[^a-z0-9+./ -]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
