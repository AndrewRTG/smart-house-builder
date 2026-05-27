package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MonitorSpecificationExtractor {

    private static final Double DEFAULT_LENGTH = 0.31;
    private static final Double DEFAULT_WIDTH = 0.51;

    private static final String DEFAULT_DISPLAY_TECH = "IPS";
    private static final String DEFAULT_RESOLUTION = "OTHER";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "length_m",
                "width_m",
                "display_technology",
                "resolution",
                "refresh_rate_hz",
                "response_time_ms"
        );

        Double diagonalInches = extractDiagonalInches(text);
        Double lengthMeters = null;
        Double widthMeters = null;

        if (diagonalInches != null) {
            double diagMeters = diagonalInches * 0.0254;
            widthMeters = diagMeters * 0.8715;
            lengthMeters = diagMeters * 0.4903;
        }

        specs.put("length_m", toRequiredDouble(lengthMeters, DEFAULT_LENGTH));
        specs.put("width_m", toRequiredDouble(widthMeters, DEFAULT_WIDTH));

        specs.put("display_technology", toRequiredString(extractDisplayTech(text), DEFAULT_DISPLAY_TECH));
        specs.put("resolution", toRequiredString(extractResolution(text), DEFAULT_RESOLUTION));

        SpecificationUtils.putIfFound(specs, "refresh_rate_hz", extractRefreshRate(text));
        SpecificationUtils.putIfFound(specs, "response_time_ms", extractResponseTime(text));

        return specs;
    }

    private static Double toRequiredDouble(Double value, Double fallback) {
        if (value == null || value < 0.05) {
            return fallback;
        }
        return value;
    }

    private static String toRequiredString(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }

    private static Double extractDiagonalInches(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{2}(?:[\\.,]\\d)?)\\s*(?:\"|inch|inchi|')\\b");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));
            if (val instanceof Number number) {
                return number.doubleValue();
            }
        }
        return null;
    }

    private static String extractDisplayTech(String text) {
        if (SpecificationUtils.containsAny(text, "amoled")) return "AMOLED";
        if (SpecificationUtils.containsAny(text, "oled")) return "OLED";
        if (SpecificationUtils.containsAny(text, "ips")) return "IPS";
        if (SpecificationUtils.containsAny(text, "va")) return "VA";
        if (SpecificationUtils.containsAny(text, "tn")) return "TN";
        return null;
    }

    private static String extractResolution(String text) {
        if (SpecificationUtils.containsAny(text, "4k", "uhd", "3840x2160", "2160p")) return "UHD_4K";
        if (SpecificationUtils.containsAny(text, "2k", "qhd", "1440p", "2560x1440")) return "QHD_2K";
        if (SpecificationUtils.containsAny(text, "1080p", "fhd", "1920x1080", "full hd")) return "FHD_1080P";
        if (SpecificationUtils.containsAny(text, "720p", "hd ready", "1280x720")) return "HD_720P";
        return null;
    }

    private static Integer extractRefreshRate(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{2,3})\\s*(?:hz|hertz)\\b");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                int hz = Integer.parseInt(matcher.group(1));
                if (hz >= 30 && hz <= 600) return hz;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Double extractResponseTime(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+(?:[\\.,]\\d+)?)\\s*ms\\b");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));
            if (val instanceof Number number) {
                double ms = number.doubleValue();
                if (ms >= 0.1 && ms <= 50.0) return ms;
            }
        }
        return null;
    }
}