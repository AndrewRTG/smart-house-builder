package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ApplianceSpecificationExtractor {

    private static final String DEFAULT_APPLIANCE_TYPE = "AIR_PURIFIER";
    private static final String DEFAULT_ENERGY_CLASS = "A";
    private static final Integer DEFAULT_POWER_CONSUMPTION = 45;

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "appliance_type",
                "power_consumption_w",
                "energy_class"
        );

        String applianceType = toRequiredString(extractApplianceType(text), DEFAULT_APPLIANCE_TYPE);
        String energyClass = toRequiredString(extractEnergyClass(text), DEFAULT_ENERGY_CLASS);

        specs.put("appliance_type", applianceType);
        specs.put("energy_class", energyClass);
        specs.put("power_consumption_w", extractPowerConsumptionWithFallback(text, applianceType));

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

    private static String extractApplianceType(String text) {
        if (SpecificationUtils.containsAny(text,
                "purificator de aer",
                "purificator aer",
                "air purifier",
                "filtru true hepa",
                "true hepa",
                "filtru hepa",
                "carbon activ",
                "filtrare 99.97",
                "levoit")) {
            return "AIR_PURIFIER";
        }

        if (SpecificationUtils.containsAny(text,
                "aer conditionat",
                "climatizare",
                "aparat aer conditionat",
                "ac smart")) {
            return "AIR_CONDITIONER";
        }

        if (SpecificationUtils.containsAny(text,
                "incalzitor",
                "radiator",
                "aeroterma",
                "convector")) {
            return "ELECTRIC_HEATER";
        }

        if (SpecificationUtils.containsAny(text,
                "masina de spalat rufe",
                "masina spalat rufe",
                "washer",
                "washing machine")) {
            return "WASHING_MACHINE";
        }

        if (SpecificationUtils.containsAny(text,
                "masina de spalat vase",
                "masina spalat vase",
                "dishwasher")) {
            return "DISHWASHER";
        }

        if (SpecificationUtils.containsAny(text,
                "cuptor electric",
                "cuptor smart",
                "cuptor")) {
            return "ELECTRIC_OVEN";
        }

        if (SpecificationUtils.containsAny(text,
                "frigider",
                "combina frigorifica",
                "racitor",
                "refrigerator")) {
            return "REFRIGERATOR";
        }

        if (SpecificationUtils.containsAny(text,
                "congelator",
                "lada frigorifica",
                "freezer")) {
            return "FREEZER";
        }

        if (SpecificationUtils.containsAny(text,
                "espressor",
                "espresso",
                "filtru de cafea",
                "cafetiera",
                "coffee maker")) {
            return "COFFEE_MAKER";
        }

        if (SpecificationUtils.containsAny(text,
                "microunde",
                "cuptor cu microunde",
                "microwave")) {
            return "MICROWAVE";
        }

        if (SpecificationUtils.containsAny(text,
                "prajitor",
                "toaster",
                "prajitor paine",
                "prajitor de paine")) {
            return "TOASTER";
        }

        return DEFAULT_APPLIANCE_TYPE;
    }

    private static String extractEnergyClass(String text) {
        Pattern pattern = Pattern.compile("\\bclasa\\s*(?:energetica\\s*)?([a-g])(?:(\\+{1,3}))?\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            return normalizeEnergyClass(matcher.group(1), matcher.group(2));
        }

        Pattern englishPattern = Pattern.compile("\\benergy\\s*class\\s*([a-g])(?:(\\+{1,3}))?\\b");
        Matcher englishMatcher = englishPattern.matcher(text);

        if (englishMatcher.find()) {
            return normalizeEnergyClass(englishMatcher.group(1), englishMatcher.group(2));
        }

        return DEFAULT_ENERGY_CLASS;
    }

    private static String normalizeEnergyClass(String base, String pluses) {
        String baseClass = base.toUpperCase();

        if (pluses == null) {
            return baseClass;
        }

        if (pluses.equals("+")) {
            return baseClass + "_PLUS";
        }

        if (pluses.equals("++")) {
            return baseClass + "_PLUS_PLUS";
        }

        if (pluses.equals("+++")) {
            return baseClass + "_PLUS_PLUS_PLUS";
        }

        return baseClass;
    }

    private static Integer extractPowerConsumptionWithFallback(String text, String applianceType) {
        Integer extractedPower = extractPowerConsumption(text);

        if (extractedPower != null && extractedPower >= 1) {
            return extractedPower;
        }

        if (SpecificationUtils.containsAny(text,
                "purificator de aer",
                "purificator aer",
                "air purifier",
                "filtru hepa",
                "true hepa",
                "levoit")) {
            return 45;
        }

        return switch (applianceType) {
            case "AIR_PURIFIER" -> 45;
            case "AIR_CONDITIONER" -> 1000;
            case "ELECTRIC_HEATER" -> 1500;
            case "WASHING_MACHINE" -> 2000;
            case "DISHWASHER" -> 1800;
            case "ELECTRIC_OVEN" -> 2000;
            case "REFRIGERATOR" -> 150;
            case "FREEZER" -> 120;
            case "COFFEE_MAKER" -> 1000;
            case "MICROWAVE" -> 800;
            case "TOASTER" -> 800;
            default -> DEFAULT_POWER_CONSUMPTION;
        };
    }

    private static Integer extractPowerConsumption(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{1,4})\\s*(?:w|watt|wati)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));

            if (val instanceof Number number) {
                int power = number.intValue();

                if (power >= 1 && power <= 5000) {
                    return power;
                }
            }
        }

        Pattern kwPattern = Pattern.compile("\\b(\\d+(?:[\\.,]\\d+)?)\\s*(?:kw|kilowatt)\\b");
        Matcher kwMatcher = kwPattern.matcher(text);

        while (kwMatcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(kwMatcher.group(1));

            if (val instanceof Number number) {
                int power = (int) Math.round(number.doubleValue() * 1000);

                if (power >= 1 && power <= 5000) {
                    return power;
                }
            }
        }

        return null;
    }
}