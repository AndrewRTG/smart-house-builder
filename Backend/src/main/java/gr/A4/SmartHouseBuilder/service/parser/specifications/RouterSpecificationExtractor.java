package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RouterSpecificationExtractor {

    private static final Integer DEFAULT_SPEED_MBPS = 300;

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "max_speed_mbps",
                "frequency_bands",
                "number_of_lan_ports",
                "has_mesh_support"
        );

        specs.put("max_speed_mbps", toRequiredInteger(extractMaxSpeedMbps(text), DEFAULT_SPEED_MBPS));

        Boolean hasMesh = extractHasMeshSupport(text);
        specs.put("has_mesh_support", hasMesh != null ? hasMesh : false);

        List<String> bands = extractFrequencyBands(text);
        if (!bands.isEmpty()) {
            specs.put("frequency_bands", bands);
        }

        SpecificationUtils.putIfFound(specs, "number_of_lan_ports", extractLanPorts(text));

        return specs;
    }

    private static Integer toRequiredInteger(Integer value, Integer fallback) {
        if (value == null || value < 1) {
            return fallback;
        }
        return value;
    }

    private static Integer extractMaxSpeedMbps(String text) {
        Pattern standardPattern = Pattern.compile("\\b(?:ax|ac|n|wi-fi\\s*\\d?)\\s*(\\d{3,5})\\b");
        Matcher standardMatcher = standardPattern.matcher(text);
        while (standardMatcher.find()) {
            Integer val = parseIntInRange(standardMatcher.group(1), 100, 50000);
            if (val != null) return val;
        }

        Pattern sumPattern = Pattern.compile("(\\d{3,5})\\s*(?:mbps)?\\s*\\+\\s*(\\d{3,5})\\s*(?:mbps)?");
        Matcher sumMatcher = sumPattern.matcher(text);
        while (sumMatcher.find()) {
            try {
                int a = Integer.parseInt(sumMatcher.group(1));
                int b = Integer.parseInt(sumMatcher.group(2));
                int total = a + b;
                if (total >= 100 && total <= 50000) return total;
            } catch (Exception ignored) {}
        }

        Pattern mbpsPattern = Pattern.compile("\\b(\\d{3,5})\\s*mbps\\b");
        Matcher mbpsMatcher = mbpsPattern.matcher(text);
        while (mbpsMatcher.find()) {
            Integer val = parseIntInRange(mbpsMatcher.group(1), 100, 50000);
            if (val != null) return val;
        }

        Pattern gbpsPattern = Pattern.compile("\\b(\\d+(?:[.,]\\d+)?)\\s*gbps\\b");
        Matcher gbpsMatcher = gbpsPattern.matcher(text);
        if (gbpsMatcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(gbpsMatcher.group(1));
            if (val instanceof Number n) {
                int mbps = (int) (n.doubleValue() * 1000);
                if (mbps >= 100 && mbps <= 50000) return mbps;
            }
        }

        return null;
    }

    private static List<String> extractFrequencyBands(String text) {
        List<String> bands = new ArrayList<>();

        boolean has6ghz = SpecificationUtils.containsAny(text, "6 ghz", "6ghz", "wi-fi 6e", "wifi 6e", "6e");
        boolean has5ghz = SpecificationUtils.containsAny(text, "5 ghz", "5ghz", "5.0 ghz", "5.0ghz", "dual band", "tri band");
        boolean has2ghz = SpecificationUtils.containsAny(text, "2.4 ghz", "2.4ghz", "2,4 ghz", "dual band", "banda 2");

        if (SpecificationUtils.containsAny(text, "wi-fi 6", "wifi 6", "802.11ax")) {
            has5ghz = true;
            has2ghz = true;
        }

        if (SpecificationUtils.containsAny(text, "wi-fi 5", "wifi 5", "802.11ac")) {
            has5ghz = true;
            has2ghz = true;
        }

        if (has6ghz) bands.add("BAND_6_GHZ");
        if (has5ghz) bands.add("BAND_5_GHZ");
        if (has2ghz) bands.add("BAND_2_4_GHZ");

        if (bands.isEmpty()) {
            bands.add("BAND_2_4_GHZ");
        }

        return bands;
    }

    private static Integer extractLanPorts(String text) {
        Pattern pattern = Pattern.compile(
                "\\b(\\d+)\\s*(?:x\\s*)?(?:port(?:uri)?\\s*)?(?:lan|rj-?45|ethernet|gigabit)\\b"
        );
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            Integer val = parseIntInRange(matcher.group(1), 0, 16);
            if (val != null) return val;
        }

        Pattern altPattern = Pattern.compile("\\b(\\d+)\\s*porturi?\\s*(?:10/100|10/100/1000|gigabit)\\b");
        Matcher altMatcher = altPattern.matcher(text);
        if (altMatcher.find()) {
            return parseIntInRange(altMatcher.group(1), 0, 16);
        }

        return null;
    }

    private static Boolean extractHasMeshSupport(String text) {
        if (SpecificationUtils.containsAny(text,
                "mesh",
                "sistem mesh",
                "wi-fi mesh",
                "wifi mesh",
                "easymesh",
                "seamless roaming",
                "roaming inteligent",
                "whole home",
                "toata casa"
        )) {
            return true;
        }
        return null;
    }

    private static Integer parseIntInRange(String value, int min, int max) {
        try {
            int parsed = Integer.parseInt(value.trim());
            return (parsed >= min && parsed <= max) ? parsed : null;
        } catch (Exception e) {
            return null;
        }
    }
}