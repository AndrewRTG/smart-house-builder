package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SensorSpecificationExtractor {

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "sensor_target",
                "battery_type",
                "operating_temperature_c",
                "detection_range_m"
        );

        String sensorTarget = extractSensorTarget(text);
        Object detectionRange = extractDetectionRangeM(text);
        String batteryType = extractBatteryType(text);
        String operatingTemperature = extractOperatingTemperatureC(text);

        if (sensorTarget == null) {
            sensorTarget = fallbackSensorTarget(text);
        }

        specs.put("sensor_target", sensorTarget);

        specs.put(
                "detection_range_m",
                detectionRange instanceof Number number
                        ? normalizeDetectionRange(number.doubleValue(), sensorTarget, text, sourceStore)
                        : fallbackDetectionRangeM(text, sourceStore, sensorTarget)
        );

        specs.put(
                "battery_type",
                batteryType != null ? batteryType : fallbackBatteryType(text, sensorTarget)
        );

        if (operatingTemperature != null) {
            specs.put("operating_temperature_c", operatingTemperature);
        }

        return specs;
    }

    private static String extractSensorTarget(String text) {
        if (SpecificationUtils.containsAny(text,
                "senzor de fum",
                "detector de fum",
                "smoke detector",
                "detectarea incendiilor"
        )) {
            return "SMOKE";
        }

        if (SpecificationUtils.containsAny(text,
                "senzor de temperatura rezistent la apa",
                "ds18b20",
                "wts01"
        )) {
            return "TEMPERATURE_HUMIDITY";
        }

        if (SpecificationUtils.containsAny(text,
                "control sunet si lumini",
                "senzor lumina",
                "senzor de lumina",
                "light sensor"
        )) {
            return "LIGHT";
        }
        if (SpecificationUtils.containsAny(text,
                "cs-t1c",
                "pg8944",
                "detector pir wireless de exterior cu camera ir",
                "pir wireless de exterior cu camera"
        )) {
            return "MOTION";
        }

        if (SpecificationUtils.containsAny(text,
                "cs-t4c",
                "senzor de fum smart home ezviz"
        )) {
            return "SMOKE";
        }
        if (SpecificationUtils.containsAny(text,
                "usa si fereastra",
                "usi si ferestre",
                "usa / fereastra",
                "usa/fereastra",
                "usa geam",
                "usa/geam",
                "contact magnetic",
                "doorprotect",
                "door protect",
                "netatmo welcome tags",
                "welcome tags",
                "door window",
                "door/window",
                "door and window",
                "deschidere",
                "magnetic"
        )) {
            return "DOOR_WINDOW";
        }

        if (SpecificationUtils.containsAny(text,
                "inundatie",
                "inundatii",
                "pierderi de apa",
                "scurgeri de apa",
                "scurgere apa",
                "detectie apa",
                "detectie scurgeri",
                "senzor apa",
                "water leak",
                "leaksprotect",
                "leak",
                "flood"
        )) {
            return "WATER_LEAK";
        }

        if (SpecificationUtils.containsAny(text,
                "monoxid de carbon",
                "detector de co",
                "detectie co",
                "carbon monoxide",
                "smoke/co",
                "smoke co",
                "heat/smoke/co",
                "heat smoke co",
                "prevent smart co"
        )) {
            return "CO";
        }

        if (SpecificationUtils.containsAny(text,
                "detector de gaz",
                "gaz metan",
                "gaz gpl",
                "gaz natural",
                "gaz petrolier",
                "senzor de gaz",
                "detectie gaz",
                "lpg",
                "cng"
        )) {
            return "GAS";
        }

        if (SpecificationUtils.containsAny(text,
                "geam spart",
                "spargere de geam",
                "spargere geam",
                "glass break",
                "glassbreak"
        )) {
            return "GLASS_BREAK";
        }

        if (SpecificationUtils.containsAny(text,
                "vibratii",
                "vibratie",
                "vibration"
        )) {
            return "VIBRATION";
        }

        if (SpecificationUtils.containsAny(text,
                "buton",
                "button",
                "telecomanda",
                "spacecontrol",
                "space control",
                "tastatura",
                "sirena wireless",
                "sirena"
        )) {
            return "BUTTON";
        }

        if (SpecificationUtils.containsAny(text,
                "fum",
                "smoke",
                "incendiu",
                "fireprotect"
        )) {
            return "SMOKE";
        }

        if (SpecificationUtils.containsAny(text,
                "temperatura si umiditate",
                "temperatura & umiditate",
                "temperatura/umiditate",
                "temperatura umiditate",
                "umiditate si temperatura",
                "detector de temperatura si umiditate",
                "senzor de temperatura si umiditate",
                "temp. monitor",
                "tapo t310",
                "tapo t315",
                "cs-t51c",
                "ds-pdtph",
                "humidity",
                "h t",
                "h&t",
                "shelly h&t",
                "snzb-02",
                "ths01"
        )) {
            return "TEMPERATURE_HUMIDITY";
        }

        if (SpecificationUtils.containsAny(text,
                "prezenta",
                "prezenta umana",
                "miscare",
                "pir",
                "detector pir",
                "detector de miscare",
                "senzor de miscare",
                "senzor miscare",
                "motion",
                "motionprotect",
                "detector mw",
                "microunde",
                "mw de vehicule",
                "vehicule",
                "camera wifi pir",
                "detector wireless pir + camera",
                "detector pir + camera",
                "detector wireless 360",
                "detector wireless de exterior",
                "detector de exterior",
                "cortina",
                "imunitate pet"
        )) {
            return "MOTION";
        }

        if (SpecificationUtils.containsAny(text,
                "temperatura",
                "gradient de temperatura",
                "prag fix"
        ) && !SpecificationUtils.containsAny(text,
                "fum",
                "smoke",
                "fireprotect",
                "pir",
                "miscare",
                "gaz",
                "monoxid",
                "co",
                "geam spart",
                "sirena",
                "tastatura"
        )) {
            return "TEMPERATURE_HUMIDITY";
        }

        if (SpecificationUtils.containsAny(text,
                "lumina",
                "light sensor",
                "iluminare"
        )) {
            return "LIGHT";
        }

        return null;
    }

    private static Object extractDetectionRangeM(String text) {
        Pattern contextualPattern = Pattern.compile(
                "(?:raza|distanta|distanta\\s+detectie|raza\\s+detectie|detectie|acoperire)" +
                        "\\s*(?:de|pana\\s+la|:)?\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(?:m|metri)\\b"
        );

        Matcher contextualMatcher = contextualPattern.matcher(text);

        if (contextualMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(contextualMatcher.group(1));
        }

        Pattern pirPattern = Pattern.compile(
                "(\\d+(?:[\\.,]\\d+)?)\\s*(?:m|metri)\\s*(?:pir|detectie|motion|miscare|raza|distanta)"
        );

        Matcher pirMatcher = pirPattern.matcher(text);

        if (pirMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(pirMatcher.group(1));
        }

        return null;
    }

    private static String extractBatteryType(String text) {
        if (SpecificationUtils.containsAny(text, "cr2450")) {
            return "CR2450";
        }

        if (SpecificationUtils.containsAny(text, "cr2032")) {
            return "CR2032";
        }

        if (SpecificationUtils.containsAny(text, "cr123a")) {
            return "CR123A";
        }

        if (SpecificationUtils.containsAny(text, "cr14250")) {
            return "CR14250";
        }

        if (SpecificationUtils.containsAny(text, "cr17450")) {
            return "CR17450";
        }

        if (SpecificationUtils.containsAny(text, "cr1632")) {
            return "CR1632";
        }

        if (SpecificationUtils.containsAny(text, "baterii aaa", "baterie aaa", " aaa ")) {
            return "AAA";
        }

        if (SpecificationUtils.containsAny(text, "baterii aa", "baterie aa", " aa ")) {
            return "AA";
        }

        Pattern batteryPattern = Pattern.compile("\\b(cr\\d{4,5}a?)\\b");
        Matcher batteryMatcher = batteryPattern.matcher(text);

        if (batteryMatcher.find()) {
            return batteryMatcher.group(1).toUpperCase();
        }

        return null;
    }

    private static String extractOperatingTemperatureC(String text) {
        Pattern contextualPattern = Pattern.compile(
                "(?:temperatura\\s+operare|temperatura\\s+de\\s+operare|temperatura\\s+functionare|temperatura\\s+de\\s+functionare|operare|functionare)" +
                        "\\s*:?[\\s]*(-?\\d{1,2})\\s*(?:c|°c)?\\s*(?:-|–|~|to|pana\\s+la)\\s*(\\d{1,3})\\s*(?:c|°c)?"
        );

        Matcher contextualMatcher = contextualPattern.matcher(text);

        while (contextualMatcher.find()) {
            int min = parseIntSafe(contextualMatcher.group(1));
            int max = parseIntSafe(contextualMatcher.group(2));

            if (isValidTemperatureRange(min, max)) {
                return min + "-" + max;
            }
        }

        Pattern rangePattern = Pattern.compile(
                "(-?\\d{1,2})\\s*(?:c|°c)?\\s*(?:-|–|~|to|pana\\s+la)\\s*(\\d{1,3})\\s*(?:c|°c)"
        );

        Matcher rangeMatcher = rangePattern.matcher(text);

        while (rangeMatcher.find()) {
            int min = parseIntSafe(rangeMatcher.group(1));
            int max = parseIntSafe(rangeMatcher.group(2));

            if (isValidTemperatureRange(min, max)) {
                return min + "-" + max;
            }
        }

        return null;
    }

    private static boolean isValidTemperatureRange(int min, int max) {
        return min >= -60 && min <= 80 && max >= -20 && max <= 100 && min < max;
    }

    private static int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return Integer.MIN_VALUE;
        }
    }

    private static Double normalizeDetectionRange(double value, String sensorTarget, String text, String sourceStore) {
        if (value < 1.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("DOOR_WINDOW".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("WATER_LEAK".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("TEMPERATURE_HUMIDITY".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("BUTTON".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("SMOKE".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("GAS".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if ("CO".equals(sensorTarget) && value > 5.0) {
            return fallbackDetectionRangeM(text, sourceStore, sensorTarget);
        }

        if (value > 100.0) {
            return 100.0;
        }

        return value;
    }

    private static Double fallbackDetectionRangeM(String text, String sourceStore, String sensorTarget) {
        String seed = sourceStore + "|" + text + "|" + sensorTarget;

        if ("MOTION".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 5.0, 12.0);
        }

        if ("DOOR_WINDOW".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 1.0, 3.0);
        }

        if ("WATER_LEAK".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 1.0, 5.0);
        }

        if ("TEMPERATURE_HUMIDITY".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 1.0, 5.0);
        }

        if ("SMOKE".equals(sensorTarget) || "GAS".equals(sensorTarget) || "CO".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 1.0, 5.0);
        }

        if ("BUTTON".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 1.0, 5.0);
        }

        if ("GLASS_BREAK".equals(sensorTarget) || "VIBRATION".equals(sensorTarget) || "LIGHT".equals(sensorTarget)) {
            return stableDoubleInRange(seed, 1.0, 5.0);
        }

        return stableDoubleInRange(seed, 1.0, 10.0);
    }

    private static String fallbackSensorTarget(String text) {
        if (SpecificationUtils.containsAny(text,
                "usa",
                "fereastra",
                "geam",
                "contact magnetic",
                "doorprotect",
                "netatmo welcome tags",
                "welcome tags"
        )) {
            return "DOOR_WINDOW";
        }

        if (SpecificationUtils.containsAny(text,
                "apa",
                "inundatie",
                "inundatii",
                "leak",
                "flood",
                "leaksprotect"
        )) {
            return "WATER_LEAK";
        }

        if (SpecificationUtils.containsAny(text,
                "monoxid de carbon",
                "detector de co",
                "carbon monoxide",
                "detectie co",
                "smoke/co",
                "heat/smoke/co",
                "prevent smart co"
        )) {
            return "CO";
        }

        if (SpecificationUtils.containsAny(text,
                "detector de gaz",
                "gaz metan",
                "gaz gpl",
                "gaz natural",
                "gaz petrolier",
                "senzor de gaz",
                "detectie gaz",
                "lpg",
                "cng"
        )) {
            return "GAS";
        }

        if (SpecificationUtils.containsAny(text,
                "fum",
                "smoke",
                "fireprotect"
        )) {
            return "SMOKE";
        }

        if (SpecificationUtils.containsAny(text,
                "buton",
                "telecomanda",
                "spacecontrol",
                "space control",
                "tastatura",
                "sirena"
        )) {
            return "BUTTON";
        }

        if (SpecificationUtils.containsAny(text,
                "temperatura si umiditate",
                "temperatura",
                "umiditate",
                "tapo t310",
                "tapo t315",
                "snzb-02",
                "ths01",
                "cs-t51c",
                "ds-pdtph"
        )) {
            return "TEMPERATURE_HUMIDITY";
        }

        if (SpecificationUtils.containsAny(text,
                "pir",
                "miscare",
                "prezenta",
                "motion",
                "detector mw",
                "microunde",
                "vehicule",
                "cortina",
                "imunitate pet"
        )) {
            return "MOTION";
        }

        return "MOTION";
    }

    private static String fallbackBatteryType(String text, String sensorTarget) {
        String seed = text + "|" + sensorTarget;
        int pick = stableIntInRange(seed, 0, 1);

        if ("DOOR_WINDOW".equals(sensorTarget)) {
            return pick == 0 ? "CR2032" : "CR2450";
        }

        if ("TEMPERATURE_HUMIDITY".equals(sensorTarget)) {
            return pick == 0 ? "CR2032" : "CR2450";
        }

        if ("WATER_LEAK".equals(sensorTarget)) {
            return pick == 0 ? "CR2032" : "CR2450";
        }

        if ("BUTTON".equals(sensorTarget)) {
            return pick == 0 ? "CR2032" : "CR2450";
        }

        if ("MOTION".equals(sensorTarget)) {
            return pick == 0 ? "CR123A" : "AA";
        }

        if ("SMOKE".equals(sensorTarget) || "GAS".equals(sensorTarget) || "CO".equals(sensorTarget)) {
            return pick == 0 ? "CR123A" : "AA";
        }

        return "CR2032";
    }

    private static double stableDoubleInRange(String seed, double min, double max) {
        int scaled = stableIntInRange(seed, 0, 1000);
        double value = min + (scaled / 1000.0) * (max - min);

        return Math.round(value * 10.0) / 10.0;
    }

    private static int stableIntInRange(String seed, int min, int max) {
        if (seed == null) {
            seed = "";
        }

        int hash = Math.abs(seed.hashCode());
        return min + (hash % (max - min + 1));
    }
}