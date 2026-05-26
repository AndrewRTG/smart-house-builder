package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CameraSpecificationExtractor {

    private static final String DEFAULT_RESOLUTION = "1080P";
    private static final String DEFAULT_STORAGE_TYPE = "MicroSD";
    private static final String DEFAULT_POWER_SOURCE = "Retea electrica";

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

        specs.put("power_source", toRequiredString(extractPowerSource(text), DEFAULT_POWER_SOURCE));

        return specs;
    }

    private static String toRequiredString(String value, String fallback) {
        if (value == null
                || value.isBlank()
                || value.equals("-")
                || value.equalsIgnoreCase("UNKNOWN")
                || value.equalsIgnoreCase("N/A")) {
            return fallback;
        }

        return value;
    }

    private static String extractResolution(String text) {
        Pattern mpPattern = Pattern.compile(
                "(?<![\\d.])\\b(\\d{1,2})(?:\\.0)?\\s*(?:mp|megapixel|megapixeli)\\b"
        );

        Matcher mpMatcher = mpPattern.matcher(text);
        if (mpMatcher.find()) {
            int mp = parseIntSafe(mpMatcher.group(1));

            if (mp > 0 && mp <= 99) {
                return mp + "MP";
            }
        }

        Pattern standardPattern = Pattern.compile(
                "\\b(1080p|720p|4k|2k|3k)\\b"
        );

        Matcher standardMatcher = standardPattern.matcher(text);
        if (standardMatcher.find()) {
            return standardMatcher.group(1).toUpperCase();
        }

        Pattern pixelsPattern = Pattern.compile(
                "\\b(1920\\s*[x×]\\s*1080|2560\\s*[x×]\\s*1440|3840\\s*[x×]\\s*2160|2304\\s*[x×]\\s*1296|3040\\s*[x×]\\s*1368)\\b"
        );

        Matcher pixelsMatcher = pixelsPattern.matcher(text);
        if (pixelsMatcher.find()) {
            String value = pixelsMatcher.group(1)
                    .replaceAll("\\s+", "")
                    .replace("×", "x");

            return switch (value) {
                case "1920x1080" -> "1080P";
                case "2560x1440" -> "2K";
                case "3840x2160" -> "4K";
                case "2304x1296" -> "3MP";
                case "3040x1368" -> "4MP";
                default -> value.toUpperCase();
            };
        }

        if (SpecificationUtils.containsAny(text, "full hd", "fhd")) {
            return "1080P";
        }

        if (SpecificationUtils.containsAny(text, "ultra hd", "uhd")) {
            return "4K";
        }

        if (SpecificationUtils.containsAny(text, "hd")) {
            return "720P";
        }

        return DEFAULT_RESOLUTION;
    }

    private static Integer extractFov(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{2,3})(?:\\.\\d+)?\\s*(?:grade|deg|°)");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String around = SpecificationUtils.surroundingText(text, matcher.start(), matcher.end(), 45);

            if (SpecificationUtils.containsAny(around,
                    "unghi",
                    "vizualizare",
                    "vizibilitate",
                    "camp",
                    "panoramic",
                    "fov")) {

                int fov = parseIntSafe(matcher.group(1));

                if (fov >= 60 && fov <= 360) {
                    return fov;
                }
            }
        }

        Pattern explicitPattern = Pattern.compile(
                "(?:unghi|vizualizare|vizibilitate|fov|camp vizual)[^\\d]{0,30}(\\d{2,3})(?:\\.\\d+)?"
        );

        Matcher explicitMatcher = explicitPattern.matcher(text);
        if (explicitMatcher.find()) {
            int fov = parseIntSafe(explicitMatcher.group(1));

            if (fov >= 60 && fov <= 360) {
                return fov;
            }
        }

        return null;
    }

    private static Boolean extractHasNightVision(String text) {
        if (SpecificationUtils.containsAny(text,
                "night vision",
                "vedere nocturna",
                "vedere de noapte",
                "infrarosu",
                "iluminator ir",
                "smart ir",
                "distanta ir",
                "0 lux cu ir",
                "lumina alba",
                "lumina calda",
                "white light",
                "smart dual light",
                "dual light",
                "full color",
                "full-color",
                "starlight",
                "colorvu",
                "spotlight",
                "floodlight",
                "imagini color 24/7",
                "inregistrare color noaptea")) {
            return true;
        }

        Pattern irPattern = Pattern.compile("\\bir\\s*\\d{1,3}\\s*m\\b");
        Matcher irMatcher = irPattern.matcher(text);
        if (irMatcher.find()) {
            return true;
        }

        Pattern irNoSpacePattern = Pattern.compile("\\bir\\d{1,3}\\s*m\\b");
        Matcher irNoSpaceMatcher = irNoSpacePattern.matcher(text);
        if (irNoSpaceMatcher.find()) {
            return true;
        }

        Pattern wlPattern = Pattern.compile("\\bwl\\s*\\d{1,3}\\s*m\\b");
        Matcher wlMatcher = wlPattern.matcher(text);
        if (wlMatcher.find()) {
            return true;
        }

        Pattern ledPattern = Pattern.compile("\\bled\\s*\\d{1,3}\\s*m\\b");
        Matcher ledMatcher = ledPattern.matcher(text);
        if (ledMatcher.find()) {
            return true;
        }

        return null;
    }

    private static Integer extractZoom(String text, String zoomType) {
        Pattern pattern1 = Pattern.compile("zoom\\s+" + zoomType + "\\s*(?:de\\s*)?(\\d+)\\s*x\\b");
        Matcher matcher1 = pattern1.matcher(text);

        if (matcher1.find()) {
            int zoom = parseIntSafe(matcher1.group(1));

            if (zoom > 0) {
                return zoom;
            }
        }

        Pattern pattern2 = Pattern.compile("\\b(\\d+)\\s*x\\s*zoom\\s+" + zoomType + "\\b");
        Matcher matcher2 = pattern2.matcher(text);

        if (matcher2.find()) {
            int zoom = parseIntSafe(matcher2.group(1));

            if (zoom > 0) {
                return zoom;
            }
        }

        return null;
    }

    private static String extractStorageType(String text) {
        if (SpecificationUtils.containsAny(text,
                "microsd",
                "micro sd",
                "card sd",
                "sd card",
                "sdcard",
                "card microsd",
                "slot microsd",
                "slot micro sd",
                "slot card",
                "slot sd",
                "cardsd",
                "tf card",
                "card tf",
                "sdhc",
                "sdxc",
                "slot 128gb",
                "slot 256gb",
                "slot 512gb",
                "card 128gb",
                "card 256gb",
                "card 512gb")) {
            return "MicroSD";
        }

        Pattern slotGbPattern = Pattern.compile("\\bslot\\s*(?:card\\s*)?\\d{2,4}\\s*gb\\b");
        Matcher slotGbMatcher = slotGbPattern.matcher(text);
        if (slotGbMatcher.find()) {
            return "MicroSD";
        }

        Pattern cardGbPattern = Pattern.compile("\\bcard\\s*\\d{2,4}\\s*gb\\b");
        Matcher cardGbMatcher = cardGbPattern.matcher(text);
        if (cardGbMatcher.find()) {
            return "MicroSD";
        }

        if (SpecificationUtils.containsAny(text, "nvr", "dvr")) {
            return "NVR/DVR";
        }

        if (SpecificationUtils.containsAny(text, "cloud", "stocare cloud")) {
            return "Cloud";
        }

        if (SpecificationUtils.containsAny(text, "hdd", "hard disk", "harddisk")) {
            return "HDD";
        }

        return DEFAULT_STORAGE_TYPE;
    }

    private static String extractPowerSource(String text) {
        if (SpecificationUtils.containsAny(text,
                "panou solar",
                "incarcare solara",
                "reincarcare solara",
                "solara",
                "solar panel")) {
            return "Solar";
        }

        if (SpecificationUtils.containsAny(text, "poe", "power over ethernet", "hi-poe")
                && !SpecificationUtils.containsAny(text,
                "fara poe",
                "nu dispune de poe",
                "fara alimentare poe",
                "nu are poe")) {
            return "PoE";
        }

        if (SpecificationUtils.containsAny(text,
                "baterie",
                "acumulator",
                "acumulatori",
                "reincarcabila",
                "reincarcabil",
                "mah",
                "battery")) {
            return "Baterie/Acumulator";
        }

        if (SpecificationUtils.containsAny(text,
                "alimentare",
                "alimentator",
                "adaptor",
                "priza",
                "cablu",
                "microusb",
                "micro usb",
                "usb",
                "usb-c",
                "type-c",
                "5v",
                "12v",
                "24v",
                "220v",
                "230v",
                "vdc",
                "vac",
                "dc 5v",
                "dc 12v")) {
            return "Retea electrica";
        }

        return DEFAULT_POWER_SOURCE;
    }

    private static int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return -1;
        }
    }
}