package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BulbSpecificationExtractor {

    private static final Double DEFAULT_POWER_W = 1.0;
    private static final Integer DEFAULT_BRIGHTNESS_LUMENS = 10;
    private static final String DEFAULT_SOCKET_TYPE = "N/A";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "power_w",
                "brightness_lumens",
                "color_temperature_k",
                "socket_type",
                "is_rgb",
                "length_m"
        );

        specs.put("power_w", toRequiredDouble(extractPowerW(text), DEFAULT_POWER_W));
        specs.put("brightness_lumens", toRequiredInteger(extractBrightnessLumens(text), DEFAULT_BRIGHTNESS_LUMENS));
        specs.put("socket_type", toRequiredString(extractSocketType(text), DEFAULT_SOCKET_TYPE));

        SpecificationUtils.putIfFound(specs, "color_temperature_k", extractColorTemperatureK(text));
        SpecificationUtils.putIfFound(specs, "length_m", extractLengthM(text));

        Boolean rgb = extractIsRgb(text);
        specs.put("is_rgb", rgb != null ? rgb : false);

        return specs;
    }

    private static Double toRequiredDouble(Object value, Double fallback) {
        if (!(value instanceof Number number)) {
            return fallback;
        }

        double doubleValue = number.doubleValue();

        if (doubleValue < fallback) {
            return fallback;
        }

        return doubleValue;
    }

    private static Integer toRequiredInteger(Object value, Integer fallback) {
        if (!(value instanceof Number number)) {
            return fallback;
        }

        double doubleValue = number.doubleValue();

        if (doubleValue < fallback) {
            return fallback;
        }

        return (int) Math.round(doubleValue);
    }

    private static String toRequiredString(String value, String fallback) {
        if (value == null || value.isBlank() || value.equals("-")) {
            return fallback;
        }

        return value;
    }

    private static Object extractPowerW(String text) {
        Pattern contextualPattern = Pattern.compile(
                "(?:putere(?:\\s+maxima)?|consum(?:\\s+maxim)?|putere\\s+nominala|consum\\s+nominal)" +
                        "\\s*:?[\\s]*(\\d+(?:[\\.,]\\d{1,3})?)\\s*w\\b"
        );

        Matcher contextualMatcher = contextualPattern.matcher(text);

        if (contextualMatcher.find()) {
            Object value = SpecificationUtils.parseNumberFlexible(contextualMatcher.group(1));

            if (isValidPower(value, text)) {
                return value;
            }
        }

        Pattern pattern = Pattern.compile("(\\d+(?:[\\.,]\\d{1,3})?)\\s*w\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String around = SpecificationUtils.surroundingText(text, matcher.start(), matcher.end(), 40);

            if (SpecificationUtils.containsAny(around, "echivalent", "equivalent", "incandescent")) {
                continue;
            }

            Object value = SpecificationUtils.parseNumberFlexible(matcher.group(1));

            if (isValidPower(value, text)) {
                return value;
            }
        }

        return null;
    }

    private static boolean isValidPower(Object value, String text) {
        if (!(value instanceof Number number)) {
            return false;
        }

        double watts = number.doubleValue();

        if (watts <= 0) {
            return false;
        }

        if (isLightingStripOrPanel(text)) {
            return watts <= 300;
        }

        return watts <= 30;
    }

    private static Object extractBrightnessLumens(String text) {
        Pattern pattern = Pattern.compile("(\\d{2,6})\\s*(?:lm|lumeni|lumen)\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            return SpecificationUtils.parseNumberFlexible(matcher.group(1));
        }

        return null;
    }

    private static String extractColorTemperatureK(String text) {
        Pattern rangePattern = Pattern.compile("(\\d{3,4})\\s*k?\\s*(?:-|–|~|to)\\s*(\\d{4})\\s*k?");
        Matcher rangeMatcher = rangePattern.matcher(text);

        while (rangeMatcher.find()) {
            int start = parseIntSafe(rangeMatcher.group(1));
            int end = parseIntSafe(rangeMatcher.group(2));

            if (isValidKelvin(start) && isValidKelvin(end) && start <= end) {
                return start + "-" + end;
            }
        }

        Pattern separatedPattern = Pattern.compile("(\\d{3,4})\\s*k\\s+(\\d{4})\\s*k");
        Matcher separatedMatcher = separatedPattern.matcher(text);

        while (separatedMatcher.find()) {
            int start = parseIntSafe(separatedMatcher.group(1));
            int end = parseIntSafe(separatedMatcher.group(2));

            if (isValidKelvin(start) && isValidKelvin(end) && start <= end) {
                return start + "-" + end;
            }
        }

        Pattern singlePattern = Pattern.compile("(\\d{3,4})\\s*k\\b");
        Matcher singleMatcher = singlePattern.matcher(text);

        while (singleMatcher.find()) {
            int value = parseIntSafe(singleMatcher.group(1));

            if (isValidKelvin(value)) {
                return String.valueOf(value);
            }
        }

        return null;
    }

    private static int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return -1;
        }
    }

    private static boolean isValidKelvin(int value) {
        return value >= 1000 && value <= 10000;
    }

    private static String extractSocketType(String text) {
        for (String socket : new String[]{"e27", "e14", "gu10", "gu5.3", "g9", "b22"}) {
            if (text.contains(socket)) {
                return socket.toUpperCase();
            }
        }

        return null;
    }

    private static Boolean extractIsRgb(String text) {
        if (SpecificationUtils.containsAny(text,
                "rgbic",
                "rgbw",
                "rgbcw",
                "rgb",
                "rbg",
                "multicolor",
                "multicolour",
                "multi color",
                "multi colour",
                "iluminare rgb",
                "lumina multicolor",
                "lumina colorata",
                "lumina alba si colorata",
                "16m",
                "16 milioane culori",
                "16 milioane de culori",
                "milioane de culori",
                "ajustare culori"
        )) {
            return true;
        }

        if (SpecificationUtils.containsAny(text,
                "lumina alba calda",
                "lumina calda",
                "lumina calda/ rece",
                "lumina calda / rece",
                "lumina alba reglabila",
                "tunable white",
                "alb cald",
                "alb rece",
                "alb neutru",
                "lumina naturala",
                "filament",
                "warm white",
                "cool white"
        )) {
            return false;
        }

        return null;
    }

    private static Object extractLengthM(String text) {
        if (!isLedStrip(text)) {
            return null;
        }

        Pattern multiplePattern = Pattern.compile("\\b(\\d+)\\s*x\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(?:m|metri)\\b");
        Matcher multipleMatcher = multiplePattern.matcher(text);

        if (multipleMatcher.find()) {
            Object countValue = SpecificationUtils.parseNumberFlexible(multipleMatcher.group(1));
            Object lengthValue = SpecificationUtils.parseNumberFlexible(multipleMatcher.group(2));

            if (countValue instanceof Number count && lengthValue instanceof Number length) {
                double total = count.doubleValue() * length.doubleValue();
                return SpecificationUtils.normalizeNumber(total);
            }
        }

        Pattern metersWordPattern = Pattern.compile("\\b(\\d+(?:[\\.,]\\d+)?)\\s*metri\\b");
        Matcher metersWordMatcher = metersWordPattern.matcher(text);

        if (metersWordMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(metersWordMatcher.group(1));
        }

        Pattern parenthesisPattern = Pattern.compile("\\((\\d+(?:[\\.,]\\d+)?)\\s*m\\)");
        Matcher parenthesisMatcher = parenthesisPattern.matcher(text);

        if (parenthesisMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(parenthesisMatcher.group(1));
        }

        Pattern tapoModelPattern = Pattern.compile("\\bl(?:900|920|930)-(\\d{1,2})\\b");
        Matcher tapoModelMatcher = tapoModelPattern.matcher(text);

        if (tapoModelMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(tapoModelMatcher.group(1));
        }

        Pattern pattern = Pattern.compile("\\b(\\d+(?:[\\.,]\\d+)?)\\s*m\\b(?!m)");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String around = SpecificationUtils.surroundingText(text, matcher.start(), matcher.end(), 50);

            if (SpecificationUtils.containsAny(around,
                    "distanta",
                    "telecomanda",
                    "raza",
                    "detectie",
                    "comunicare",
                    "dimensiune",
                    "dimensiuni",
                    "latime",
                    "inaltime",
                    "grosime",
                    "mm",
                    "cm",
                    "led/m"
            )) {
                continue;
            }

            return SpecificationUtils.parseNumberFlexible(matcher.group(1));
        }

        return null;
    }

    private static boolean isLedStrip(String text) {
        return SpecificationUtils.containsAny(text,
                "banda led",
                "banda rgb",
                "banda rgbw",
                "banda rgbic",
                "light strip",
                "led strip",
                "eve light strip",
                "nitebird sl",
                "gosund sl",
                "starter kit",
                "kit banda"
        );
    }

    private static boolean isLightingStripOrPanel(String text) {
        return SpecificationUtils.containsAny(text,
                "banda led",
                "banda rgb",
                "banda rgbw",
                "banda rgbic",
                "light strip",
                "led strip",
                "panouri luminoase",
                "nanoleaf",
                "lampa",
                "plafoniera"
        );
    }
}