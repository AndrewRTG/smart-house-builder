package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GamingConsoleSpecificationExtractor {

    private static final Integer DEFAULT_STORAGE = 500;
    private static final String DEFAULT_RESOLUTION = "UNKNOWN";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "storage_capacity_gb",
                "max_resolution_output",
                "has_disc_drive"
        );

        specs.put("storage_capacity_gb", toRequiredInteger(extractStorageCapacity(text), DEFAULT_STORAGE));
        specs.put("max_resolution_output", toRequiredString(extractResolution(text), DEFAULT_RESOLUTION));

        Boolean hasDiscDrive = extractHasDiscDrive(text);
        specs.put("has_disc_drive", hasDiscDrive != null ? hasDiscDrive : false);

        return specs;
    }

    private static Integer toRequiredInteger(Integer value, Integer fallback) {
        if (value == null || value < 1) {
            return fallback;
        }
        return value;
    }

    private static String toRequiredString(String value, String fallback) {
        if (value == null || value.isBlank() || value.equals("-")) {
            return fallback;
        }
        return value;
    }

    private static Integer extractStorageCapacity(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+(?:[\\.,]\\d+)?)\\s*(gb|tb)\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            try {
                double capacity = Double.parseDouble(matcher.group(1).replace(",", "."));
                String unit = matcher.group(2);

                if (unit.equals("tb")) {
                    capacity *= 1000;
                }

                int finalCapacity = (int) Math.round(capacity);
                if (finalCapacity >= 1) {
                    return finalCapacity;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static String extractResolution(String text) {
        Pattern pattern = Pattern.compile("\\b(8k|4k|1080p|1440p)\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            return matcher.group(1).toUpperCase();
        }
        return null;
    }

    private static Boolean extractHasDiscDrive(String text) {
        if (SpecificationUtils.containsAny(text, "digital edition", "all digital", "fara disc", "digital version")) {
            return false;
        }
        if (SpecificationUtils.containsAny(text, "blu-ray", "disc", "dvd", "cd-rom", "unitate optica")) {
            return true;
        }
        return null;
    }
}