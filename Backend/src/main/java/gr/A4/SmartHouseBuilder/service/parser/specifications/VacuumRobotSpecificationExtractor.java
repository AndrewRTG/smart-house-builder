package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class VacuumRobotSpecificationExtractor {

    private static final Integer DEFAULT_SUCTION_PA = 1000;
    private static final Integer DEFAULT_DUSTBIN_ML = 300;

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "suction_power_pa",
                "battery_capacity_mah",
                "has_mopping_function",
                "navigation_type",
                "dustbin_capacity_ml"
        );

        specs.put("suction_power_pa", toRequiredInteger(extractSuctionPowerPa(text), DEFAULT_SUCTION_PA));
        specs.put("dustbin_capacity_ml", toRequiredInteger(extractDustbinCapacityMl(text), DEFAULT_DUSTBIN_ML));

        Boolean hasMopping = extractHasMoppingFunction(text);
        specs.put("has_mopping_function", hasMopping != null ? hasMopping : false);

        SpecificationUtils.putIfFound(specs, "battery_capacity_mah", extractBatteryCapacityMah(text));
        SpecificationUtils.putIfFound(specs, "navigation_type", extractNavigationType(text));

        return specs;
    }

    private static Integer toRequiredInteger(Integer value, Integer fallback) {
        if (value == null || value < 1) {
            return fallback;
        }
        return value;
    }

    private static Integer extractSuctionPowerPa(String text) {
        Pattern contextPattern = Pattern.compile(
                "(?:putere\\s+aspirare|putere\\s+aspiratie|suction\\s+power|aspiratie|forta\\s+aspirare)" +
                        "\\s*:?\\s*(\\d{3,5})\\s*pa\\b"
        );
        Matcher contextMatcher = contextPattern.matcher(text);
        if (contextMatcher.find()) {
            return parseIntInRange(contextMatcher.group(1), 300, 30000);
        }

        Pattern paPattern = Pattern.compile("\\b(\\d{3,5})\\s*pa\\b");
        Matcher paMatcher = paPattern.matcher(text);
        while (paMatcher.find()) {
            Integer val = parseIntInRange(paMatcher.group(1), 300, 30000);
            if (val != null) return val;
        }

        return null;
    }

    private static Integer extractBatteryCapacityMah(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{3,5})\\s*mah\\b");
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            Integer val = parseIntInRange(matcher.group(1), 500, 15000);
            if (val != null) return val;
        }
        return null;
    }

    private static Boolean extractHasMoppingFunction(String text) {
        if (SpecificationUtils.containsAny(text,
                "mop",
                "spalare",
                "curatare umeda",
                "stergere umeda",
                "functie mop",
                "rezervor apa",
                "tanc apa",
                "mopping"
        )) {
            return true;
        }
        if (SpecificationUtils.containsAny(text, "doar aspirare", "numai aspirare", "vacuum only")) {
            return false;
        }
        return null;
    }

    private static String extractNavigationType(String text) {
        if (SpecificationUtils.containsAny(text, "lidar", "laser navigation", "navigatie laser")) {
            return "LIDAR";
        }
        if (SpecificationUtils.containsAny(text,
                "vslam",
                "camera navigatie",
                "navigatie vizuala",
                "camera navigation",
                "visual navigation"
        )) {
            return "CAMERA_VSLAM";
        }
        if (SpecificationUtils.containsAny(text, "giroscop", "gyroscope", "gyro")) {
            return "GYROSCOPE";
        }
        if (SpecificationUtils.containsAny(text, "navigatie aleatorie", "random", "bump and go")) {
            return "RANDOM";
        }
        return null;
    }

    private static Integer extractDustbinCapacityMl(String text) {
        Pattern contextPattern = Pattern.compile(
                "(?:capacitate\\s+rezervor|rezervor\\s+praf|recipient\\s+praf|dustbin|dust\\s+bin|dust\\s+container)" +
                        "\\s*:?\\s*(\\d{2,4})\\s*(?:ml|l|litri)?\\b"
        );
        Matcher contextMatcher = contextPattern.matcher(text);
        if (contextMatcher.find()) {
            return extractMlValue(contextMatcher.group(1), contextMatcher.group(0));
        }

        Pattern mlPattern = Pattern.compile("\\b(\\d{2,4})\\s*ml\\b");
        Matcher mlMatcher = mlPattern.matcher(text);
        while (mlMatcher.find()) {
            Integer val = parseIntInRange(mlMatcher.group(1), 100, 5000);
            if (val != null) return val;
        }

        return null;
    }

    private static Integer extractMlValue(String numberStr, String context) {
        try {
            int number = Integer.parseInt(numberStr.trim());
            if (context.contains(" l ") || context.contains("litri") || context.contains("liter")) {
                number = number * 1000;
            }
            if (number >= 100 && number <= 5000) return number;
        } catch (Exception ignored) {}
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