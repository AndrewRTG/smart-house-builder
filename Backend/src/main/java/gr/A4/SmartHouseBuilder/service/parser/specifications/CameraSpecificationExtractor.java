package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CameraSpecificationExtractor {

    private static final String DEFAULT_RESOLUTION = "UNKNOWN";
    private static final String DEFAULT_STORAGE_TYPE = "N/A";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "resolution",
                "field_of_view_degreed",
                "has_night_vision",
                "optical_zoom_x",
                "digital_zoom_x",
                "storage_type",
                "power_source"
        );

        specs.put("resolution", toRequiredString(extractResolution(text), DEFAULT_RESOLUTION));
        specs.put("storage_type", toRequiredString(extractStorageType(text), DEFAULT_STORAGE_TYPE));

        Boolean nightVision = extractHasNightVision(text);
        specs.put("has_night_vision", nightVision != null ? nightVision : false);

        SpecificationUtils.putIfFound(specs, "field_of_view_degreed", extractFov(text));
        SpecificationUtils.putIfFound(specs, "optical_zoom_x", extractZoom(text, "optic"));
        SpecificationUtils.putIfFound(specs, "digital_zoom_x", extractZoom(text, "digital"));
        SpecificationUtils.putIfFound(specs, "power_source", extractPowerSource(text));

        return specs;
    }

    private static String toRequiredString(String value, String fallback) {
        if (value == null || value.isBlank() || value.equals("-")) {
            return fallback;
        }
        return value;
    }

    private static String extractResolution(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{1,2}mp|1080p|720p|4k|2k|1920x1080|2560x1440|3840x2160)\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            return matcher.group(1).toUpperCase();
        }

        return null;
    }

    private static Integer extractFov(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{2,3})\\s*(?:grade|deg|°)");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String around = SpecificationUtils.surroundingText(text, matcher.start(), matcher.end(), 40);

            if (SpecificationUtils.containsAny(around, "unghi", "vizualizare", "camp", "panoramic", "fov", "rotatie")) {
                int fov = parseIntSafe(matcher.group(1));
                if (fov > 0 && fov <= 360) {
                    return fov;
                }
            }
        }
        return null;
    }

    private static Boolean extractHasNightVision(String text) {
        return SpecificationUtils.containsAny(text,
                "night vision",
                "vedere nocturna",
                "infrarosu",
                "iluminator ir",
                "smart ir",
                "vedere de noapte",
                "inregistrare color noaptea"
        ) ? true : null;
    }

    private static Integer extractZoom(String text, String zoomType) {
        Pattern pattern1 = Pattern.compile("zoom\\s+" + zoomType + "\\s*(?:de\\s*)?(\\d+)\\s*x\\b");
        Matcher matcher1 = pattern1.matcher(text);
        if (matcher1.find()) {
            return parseIntSafe(matcher1.group(1));
        }

        Pattern pattern2 = Pattern.compile("\\b(\\d+)\\s*x\\s*zoom\\s+" + zoomType + "\\b");
        Matcher matcher2 = pattern2.matcher(text);
        if (matcher2.find()) {
            return parseIntSafe(matcher2.group(1));
        }

        return null;
    }

    private static String extractStorageType(String text) {
        if (SpecificationUtils.containsAny(text, "microsd", "micro sd", "card sd", "sd card", "slot card")) {
            return "MicroSD";
        }
        if (SpecificationUtils.containsAny(text, "nvr", "dvr")) {
            return "NVR/DVR";
        }
        if (SpecificationUtils.containsAny(text, "cloud")) {
            return "Cloud";
        }
        if (SpecificationUtils.containsAny(text, "hdd", "hard disk")) {
            return "HDD";
        }
        return null;
    }

    private static String extractPowerSource(String text) {
        if (SpecificationUtils.containsAny(text, "poe", "power over ethernet")) {
            return "PoE";
        }
        if (SpecificationUtils.containsAny(text, "panou solar", "solara", "solar panel")) {
            return "Solar";
        }
        if (SpecificationUtils.containsAny(text, "baterie", "acumulator", "wireless", "fara fir")) {
            return "Baterie/Acumulator";
        }
        if (SpecificationUtils.containsAny(text, "alimentator", "priza", "12v", "220v", "cablu")) {
            return "Retea electrica";
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
}