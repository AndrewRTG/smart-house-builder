package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ApplianceSpecificationExtractor {

    private static final String DEFAULT_APPLIANCE_TYPE = "UNKNOWN";
    private static final String DEFAULT_ENERGY_CLASS = "UNKNOWN";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "appliance_type",
                "power_consumption_w",
                "energy_class"
        );

        specs.put("appliance_type", toRequiredString(extractApplianceType(text), DEFAULT_APPLIANCE_TYPE));
        specs.put("energy_class", toRequiredString(extractEnergyClass(text), DEFAULT_ENERGY_CLASS));

        SpecificationUtils.putIfFound(specs, "power_consumption_w", extractPowerConsumption(text));

        return specs;
    }

    private static String toRequiredString(String value, String fallback) {
        if (value == null || value.isBlank() || value.equals("-")) {
            return fallback;
        }
        return value;
    }

    private static String extractApplianceType(String text) {
        if (SpecificationUtils.containsAny(text, "aer conditionat", "climatizare")) return "AIR_CONDITIONER";
        if (SpecificationUtils.containsAny(text, "incalzitor", "radiator", "aeroterma", "convector")) return "ELECTRIC_HEATER";
        if (SpecificationUtils.containsAny(text, "masina de spalat rufe")) return "WASHING_MACHINE";
        if (SpecificationUtils.containsAny(text, "masina de spalat vase")) return "DISHWASHER";
        if (SpecificationUtils.containsAny(text, "cuptor")) return "ELECTRIC_OVEN";
        if (SpecificationUtils.containsAny(text, "frigider", "combina frigorifica")) return "REFRIGERATOR";
        if (SpecificationUtils.containsAny(text, "congelator", "lada frigorifica")) return "FREEZER";
        if (SpecificationUtils.containsAny(text, "espressor", "filtru de cafea", "cafetiera")) return "COFFEE_MAKER";
        if (SpecificationUtils.containsAny(text, "microunde")) return "MICROWAVE";
        if (SpecificationUtils.containsAny(text, "prajitor", "toaster")) return "TOASTER";

        return null;
    }

    private static String extractEnergyClass(String text) {
        Pattern pattern = Pattern.compile("\\bclasa\\s*(?:energetica\\s*)?([a-g])(?:(\\+{1,3}))?\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            String baseClass = matcher.group(1).toUpperCase();
            String pluses = matcher.group(2);

            if (pluses != null) {
                if (pluses.equals("+")) return baseClass + "_PLUS";
                if (pluses.equals("++")) return baseClass + "_PLUS_PLUS";
                if (pluses.equals("+++")) return baseClass + "_PLUS_PLUS_PLUS";
            }
            return baseClass;
        }
        return null;
    }

    private static Integer extractPowerConsumption(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{3,4})\\s*(?:w|watt|wati)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));
            if (val instanceof Number number) {
                int power = number.intValue();
                if (power >= 10 && power <= 5000) {
                    return power;
                }
            }
        }
        return null;
    }
}