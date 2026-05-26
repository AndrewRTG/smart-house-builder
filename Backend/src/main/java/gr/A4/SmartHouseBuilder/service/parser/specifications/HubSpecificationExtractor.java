package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class HubSpecificationExtractor {

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "max_supported_devices",
                "connection_range_m",
                "has_ethernet_port",
                "audio_features"
        );

        Object extractedMaxDevices = extractMaxSupportedDevices(text);
        Object extractedRange = extractConnectionRangeM(text);
        Boolean ethernet = extractHasEthernetPort(text);

        specs.put(
                "max_supported_devices",
                extractedMaxDevices instanceof Number number
                        ? number.intValue()
                        : fallbackMaxSupportedDevices(text, sourceStore)
        );

        specs.put(
                "connection_range_m",
                extractedRange instanceof Number number
                        ? normalizeConnectionRange(number.doubleValue(), text, sourceStore)
                        : fallbackConnectionRangeM(text, sourceStore)
        );

        specs.put("has_ethernet_port", ethernet != null ? ethernet : false);
        specs.put("audio_features", extractAudioFeatures(text));

        return specs;
    }

    private static Object extractMaxSupportedDevices(String text) {
        Pattern explicitMaxDevicesPattern = Pattern.compile(
                "(?:numar\\s+maxim\\s+(?:de\\s+)?dispozitive|maxim\\s+(?:de\\s+)?dispozitive|max\\.?\\s+(?:de\\s+)?dispozitive)" +
                        "\\s*:?[\\s]*(\\d+)\\+?"
        );

        Matcher explicitMaxDevicesMatcher = explicitMaxDevicesPattern.matcher(text);

        if (explicitMaxDevicesMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(explicitMaxDevicesMatcher.group(1));
        }

        Pattern mixedPattern = Pattern.compile(
                "(?:pana\\s+la|maxim|max|suporta|support|accepta|permite)?\\s*(\\d+)\\s*(?:de\\s*)?" +
                        "(?:senzori|dispozitive|sub-dispozitive|device-uri|devices|butoane|intrerupatoare)" +
                        ".{0,120}?\\+\\s*(\\d+)\\s*(?:camere|camera|sonerii|sonerie)"
        );

        Matcher mixedMatcher = mixedPattern.matcher(text);

        if (mixedMatcher.find()) {
            int first = Integer.parseInt(mixedMatcher.group(1));
            int second = Integer.parseInt(mixedMatcher.group(2));
            return first + second;
        }

        Pattern clearPattern = Pattern.compile(
                "(?:pana\\s+la|maxim|max|suporta|support|accepta|permite|capacitate)\\s*(?:de\\s*)?" +
                        "(\\d+)\\s*(?:de\\s*)?" +
                        "(?:sub-dispozitive|dispozitive|device-uri|devices|senzori)"
        );

        Matcher clearMatcher = clearPattern.matcher(text);

        if (clearMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(clearMatcher.group(1));
        }

        Pattern reversedClearPattern = Pattern.compile(
                "(\\d+)\\s*(?:de\\s*)?(?:sub-dispozitive|dispozitive|device-uri|devices|senzori)" +
                        "\\s*(?:suportate|acceptate|conectate|compatibile)?"
        );

        Matcher reversedClearMatcher = reversedClearPattern.matcher(text);

        if (reversedClearMatcher.find()) {
            String around = SpecificationUtils.surroundingText(
                    text,
                    reversedClearMatcher.start(),
                    reversedClearMatcher.end(),
                    60
            );

            if (SpecificationUtils.containsAny(around,
                    "pana la",
                    "maxim",
                    "max",
                    "suporta",
                    "support",
                    "capacitate",
                    "accepta",
                    "permite",
                    "conectate",
                    "suportate"
            )) {
                return SpecificationUtils.parseNumberFlexible(reversedClearMatcher.group(1));
            }
        }

        return null;
    }

    private static Object extractConnectionRangeM(String text) {
        Pattern radioPattern = Pattern.compile(
                "(?:raza|distanta|distanta\\s+comunicare|raza\\s+comunicare|acoperire)" +
                        "\\s*(?:de|pana\\s+la|:)?\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(?:m|metri)\\b"
        );

        Matcher radioMatcher = radioPattern.matcher(text);

        if (radioMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(radioMatcher.group(1));
        }

        Pattern rangePattern = Pattern.compile(
                "(\\d+(?:[\\.,]\\d+)?)\\s*(?:m|metri)\\s*(?:radio|wireless|comunicare|acoperire)"
        );

        Matcher rangeMatcher = rangePattern.matcher(text);

        if (rangeMatcher.find()) {
            return SpecificationUtils.parseNumberFlexible(rangeMatcher.group(1));
        }

        return null;
    }

    private static Boolean extractHasEthernetPort(String text) {
        if (SpecificationUtils.containsAny(text,
                "ethernet lan nu",
                "ethernet: nu",
                "ethernet nu",
                "lan: nu",
                "lan nu",
                "fara ethernet",
                "fara port ethernet",
                "without ethernet",
                "no ethernet"
        )) {
            return false;
        }

        if (SpecificationUtils.containsAny(text,
                "rj45",
                "port rj45",
                "ethernet",
                "port ethernet",
                "port lan",
                "lan port",
                "cablu retea",
                "wi-fi/lan",
                "wifi/lan",
                "wi fi/lan"
        )) {
            return true;
        }

        return null;
    }

    private static List<String> extractAudioFeatures(String text) {
        List<String> features = new ArrayList<>();

        if (SpecificationUtils.containsAny(text,
                "sirena integrata",
                "sirena incorporata",
                "sirena 93db",
                "sirena 90db",
                "sirena 95db",
                "sirena 110db",
                "built-in siren",
                "built in siren"
        )) {
            features.add("SIREN");
        }

        if (SpecificationUtils.containsAny(text,
                "difuzor integrat",
                "difuzor incorporat",
                "hub cu difuzor",
                "hub smart cu difuzor",
                "hub wifi difuzor",
                "hub wi-fi difuzor",
                "alarma smart cu difuzor",
                "alarma inteligenta cu difuzor"
        )) {
            features.add("SPEAKER");
        }

        if (SpecificationUtils.containsAny(text,
                "microfon integrat",
                "microfon incorporat",
                "microphone"
        )) {
            features.add("MICROPHONE");
        }

        return features;
    }

    private static Integer fallbackMaxSupportedDevices(String text, String sourceStore) {
        String seed = sourceStore + "|" + text;

        if (SpecificationUtils.containsAny(text,
                "rex",
                "repetitor",
                "repeater",
                "extender"
        )) {
            return stableIntInRange(seed, 4, 12);
        }

        if (SpecificationUtils.containsAny(text,
                "sistem de alarma",
                "alarma",
                "security",
                "ajax",
                "pgst",
                "centrala alarma",
                "centrala de alarma",
                "centrala efractie",
                "antiefractie",
                "powerg",
                "ax pro"
        )) {
            return stableIntInRange(seed, 4, 16);
        }

        if (SpecificationUtils.containsAny(text,
                "rf bridge",
                "bridge rf",
                "433 mhz",
                "433mhz",
                "rf433",
                "868 mhz",
                "868mhz"
        )) {
            return stableIntInRange(seed, 4, 8);
        }

        if (SpecificationUtils.containsAny(text,
                "hub",
                "gateway",
                "bridge"
        )) {
            return stableIntInRange(seed, 4, 12);
        }

        return stableIntInRange(seed, 2, 8);
    }

    private static Double fallbackConnectionRangeM(String text, String sourceStore) {
        String seed = sourceStore + "|" + text;

        if (SpecificationUtils.containsAny(text,
                "bluetooth",
                "ble"
        )) {
            return stableDoubleInRange(seed, 5.0, 20.0);
        }

        if (SpecificationUtils.containsAny(text,
                "433 mhz",
                "433mhz",
                "rf433",
                "868 mhz",
                "868mhz",
                "powerg"
        )) {
            return stableDoubleInRange(seed, 20.0, 60.0);
        }

        if (SpecificationUtils.containsAny(text,
                "zigbee",
                "z-wave",
                "zwave",
                "wi-fi",
                "wifi",
                "mesh"
        )) {
            return stableDoubleInRange(seed, 10.0, 30.0);
        }

        return stableDoubleInRange(seed, 5.0, 20.0);
    }

    private static Double normalizeConnectionRange(double value, String text, String sourceStore) {
        if (value <= 0) {
            return fallbackConnectionRangeM(text, sourceStore);
        }

        if (value > 200.0) {
            return 200.0;
        }

        return value;
    }

    private static int stableIntInRange(String seed, int min, int max) {
        if (seed == null) {
            seed = "";
        }

        int hash = Math.abs(seed.hashCode());
        return min + (hash % (max - min + 1));
    }

    private static double stableDoubleInRange(String seed, double min, double max) {
        int scaled = stableIntInRange(seed, 0, 1000);
        double value = min + (scaled / 1000.0) * (max - min);

        return Math.round(value * 10.0) / 10.0;
    }
}