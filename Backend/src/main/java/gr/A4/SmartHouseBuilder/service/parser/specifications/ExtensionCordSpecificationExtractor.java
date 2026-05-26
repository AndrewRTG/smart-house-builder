package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExtensionCordSpecificationExtractor {

    private static final Integer DEFAULT_SOCKETS = 3;
    private static final Integer DEFAULT_MAX_POWER = 3680;
    private static final Integer DEFAULT_MAX_CURRENT = 16;
    private static final Double DEFAULT_CABLE_LENGTH = 1.5;

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "number_of_sockets",
                "number_of_usb_ports",
                "max_power_w",
                "max_current_a",
                "has_energy_monitoring",
                "cable_length_m"
        );

        specs.put("number_of_sockets", toRequiredInteger(extractNumberOfSockets(text), DEFAULT_SOCKETS));
        specs.put("max_power_w", toRequiredInteger(extractMaxPower(text), DEFAULT_MAX_POWER));
        specs.put("max_current_a", toRequiredInteger(extractMaxCurrent(text), DEFAULT_MAX_CURRENT));
        specs.put("cable_length_m", toRequiredDouble(extractCableLength(text), DEFAULT_CABLE_LENGTH));

        SpecificationUtils.putIfFound(specs, "number_of_usb_ports", extractUsbPorts(text));

        Boolean energyMonitoring = extractEnergyMonitoring(text);
        specs.put("has_energy_monitoring", energyMonitoring != null ? energyMonitoring : false);

        return specs;
    }

    private static Integer toRequiredInteger(Integer value, Integer fallback) {
        if (value == null || value < 1) {
            return fallback;
        }
        return value;
    }

    private static Double toRequiredDouble(Double value, Double fallback) {
        if (value == null || value < 0.01) {
            return fallback;
        }
        return value;
    }

    private static Integer extractNumberOfSockets(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+)\\s*(?:prize|iesiri|x\\s*schuko|socluri|porturi ac|cai)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            try {
                int count = Integer.parseInt(matcher.group(1));
                if (count >= 1 && count <= 20) {
                    return count;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Integer extractUsbPorts(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+)\\s*(?:x\\s*)?usb\\b");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            try {
                int count = Integer.parseInt(matcher.group(1));
                if (count >= 1 && count <= 10) {
                    return count;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Integer extractMaxPower(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{3,4})\\s*(?:w|watt|wati)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));
            if (val instanceof Number number) {
                int power = number.intValue();
                if (power >= 100 && power <= 5000) {
                    return power;
                }
            }
        }
        return null;
    }

    private static Integer extractMaxCurrent(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+)\\s*(?:a|amperi)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            try {
                int current = Integer.parseInt(matcher.group(1));
                if (current >= 1 && current <= 32) {
                    return current;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Double extractCableLength(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+(?:[\\.,]\\d+)?)\\s*(?:m|metri|metru)\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(matcher.group(1));
            if (val instanceof Number number) {
                double length = number.doubleValue();
                if (length >= 0.1 && length <= 50.0) {
                    return length;
                }
            }
        }
        return null;
    }

    private static Boolean extractEnergyMonitoring(String text) {
        return SpecificationUtils.containsAny(text,
                "monitorizare energie", "monitorizare consum", "masurare consum",
                "contor energie", "energy monitoring", "masoara consumul", "monitorizeaza consumul"
        ) ? true : null;
    }
}