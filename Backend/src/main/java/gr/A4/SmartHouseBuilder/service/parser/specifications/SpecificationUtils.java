package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.LinkedHashMap;
import java.util.Map;

public class SpecificationUtils {

    public static Map<String, Object> base(String... keys) {
        Map<String, Object> map = new LinkedHashMap<>();

        for (String key : keys) {
            map.put(key, "-");
        }

        return map;
    }

    public static void putIfFound(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }

    public static boolean containsAny(String text, String... keywords) {
        if (text == null) {
            return false;
        }

        String normalizedText = normalize(text);

        for (String keyword : keywords) {
            if (normalizedText.contains(normalize(keyword))) {
                return true;
            }
        }

        return false;
    }

    public static Object parseNumberFlexible(String value) {
        if (value == null) {
            return null;
        }

        try {
            String cleaned = value.trim();


            if (cleaned.matches("\\d{1,3}[\\.,]\\d{3}")) {
                cleaned = cleaned.replace(".", "").replace(",", "");
                return Integer.parseInt(cleaned);
            }


            cleaned = cleaned.replace(",", ".");
            double parsed = Double.parseDouble(cleaned);

            return normalizeNumber(parsed);
        } catch (Exception e) {
            return null;
        }
    }

    public static Object normalizeNumber(double value) {
        if (value == Math.floor(value)) {
            return (int) value;
        }

        return value;
    }

    public static String surroundingText(String text, int start, int end, int radius) {
        int safeStart = Math.max(0, start - radius);
        int safeEnd = Math.min(text.length(), end + radius);

        return text.substring(safeStart, safeEnd);
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
                .replace("ă", "a")
                .replace("â", "a")
                .replace("î", "i")
                .replace("ș", "s")
                .replace("ş", "s")
                .replace("ț", "t")
                .replace("ţ", "t")
                .replace("°", " ")
                .replaceAll("<[^>]*>", " ")
                .replaceAll("[^a-z0-9+./&:,><! -]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}