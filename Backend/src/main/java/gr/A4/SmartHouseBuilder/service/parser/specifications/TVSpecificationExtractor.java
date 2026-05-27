package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TVSpecificationExtractor {

    private static final Double DEFAULT_LENGTH = 0.44;
    private static final Double DEFAULT_WIDTH = 0.78;
    private static final String DEFAULT_DISPLAY_TECH = "IPS";
    private static final String DEFAULT_RESOLUTION = "FHD_1080P";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "length_m",
                "width_m",
                "display_technology",
                "resolution",
                "refresh_rate_hz",
                "operating_system"
        );

        Double diagonalInches = extractDiagonalInches(text);
        Double lengthMeters = null;
        Double widthMeters = null;

        if (diagonalInches != null) {
            double diagMeters = diagonalInches * 0.0254;
            widthMeters = diagMeters * 0.8715;  // cos(arctan(9/16))
            lengthMeters = diagMeters * 0.4903;  // sin(arctan(9/16))
        }

        specs.put("length_m", toRequiredDouble(lengthMeters, DEFAULT_LENGTH));
        specs.put("width_m", toRequiredDouble(widthMeters, DEFAULT_WIDTH));
        specs.put("display_technology", toRequiredString(extractDisplayTech(text), DEFAULT_DISPLAY_TECH));
        specs.put("resolution", toRequiredString(extractResolution(text), DEFAULT_RESOLUTION));

        SpecificationUtils.putIfFound(specs, "refresh_rate_hz", extractRefreshRate(text));
        SpecificationUtils.putIfFound(specs, "operating_system", extractOperatingSystem(text));

        return specs;
    }

    private static Double toRequiredDouble(Double value, Double fallback) {
        if (value == null || value < 0.3) {
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

    private static Double extractDiagonalInches(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{2,3}(?:[.,]\\d)?)\\s*(?:\"|inch|inchi|')\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));
            if (val instanceof Number n) {
                double inches = n.doubleValue();
                if (inches >= 24 && inches <= 120) return inches;
            }
        }

        Pattern impliedPattern = Pattern.compile("(?:tv|televizor)\\s+(\\d{2,3})\\b");
        Matcher impliedMatcher = impliedPattern.matcher(text);
        while (impliedMatcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(impliedMatcher.group(1));
            if (val instanceof Number n) {
                double inches = n.doubleValue();
                if (inches >= 24 && inches <= 120) return inches;
            }
        }

        return null;
    }

    private static String extractDisplayTech(String text) {
        if (SpecificationUtils.containsAny(text, "amoled")) return "AMOLED";
        if (SpecificationUtils.containsAny(text, "qd-oled", "qd oled", "quantum oled", "oled")) return "OLED";

        boolean isMarketingTerm = SpecificationUtils.containsAny(text,
                "qled", "quantum led", "nanocell", "nanoled", "mini led", "miniled", "mini-led"
        );

        if (isMarketingTerm) {
            if (SpecificationUtils.containsAny(text, "nanocell", "nanoled")) return "IPS";
            if (SpecificationUtils.containsAny(text, "ips")) return "IPS";
            if (SpecificationUtils.containsAny(text, " va ")) return "VA";
            return null;
        }

        if (SpecificationUtils.containsAny(text, "ips")) return "IPS";
        if (SpecificationUtils.containsAny(text, " va ")) return "VA";
        if (SpecificationUtils.containsAny(text, "tn")) return "TN";

        return null;
    }

    private static String extractResolution(String text) {
        if (SpecificationUtils.containsAny(text, "8k", "7680x4320")) return "UHD_8K";
        if (SpecificationUtils.containsAny(text, "4k", "uhd", "3840x2160", "2160p")) return "UHD_4K";
        if (SpecificationUtils.containsAny(text, "2k", "qhd", "1440p", "2560x1440")) return "QHD_2K";
        if (SpecificationUtils.containsAny(text, "1080p", "fhd", "full hd", "1920x1080")) return "FHD_1080P";
        if (SpecificationUtils.containsAny(text, "720p", "hd ready", "1280x720")) return "HD_720P";
        return null;
    }

    private static Integer extractRefreshRate(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{2,3})\\s*(?:hz|hertz)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            try {
                int hz = Integer.parseInt(matcher.group(1));
                if (hz >= 50 && hz <= 240) return hz;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static String extractOperatingSystem(String text) {
        if (SpecificationUtils.containsAny(text, "google tv")) return "GOOGLE_TV";
        if (SpecificationUtils.containsAny(text, "android tv")) return "ANDROID_TV";
        if (SpecificationUtils.containsAny(text, "tizen")) return "TIZEN";
        if (SpecificationUtils.containsAny(text, "webos", "web os")) return "WEBOS";
        if (SpecificationUtils.containsAny(text, "roku")) return "ROKU_TV";
        if (SpecificationUtils.containsAny(text, "fire tv", "firetv")) return "FIRE_TV";
        if (SpecificationUtils.containsAny(text, "vidaa")) return "VIDAA";
        if (SpecificationUtils.containsAny(text, "saphi")) return "SAPHI";
        if (SpecificationUtils.containsAny(text, "android")) return "ANDROID_TV";
        return null;
    }
}