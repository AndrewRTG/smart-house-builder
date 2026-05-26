package gr.A4.SmartHouseBuilder.service.parser.specifications;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AudioSystemSpecificationExtractor {

    private static final Integer DEFAULT_POWER_RMS_W = 10;
    private static final String DEFAULT_FREQUENCY_RESPONSE = "20-20000";

    public static Map<String, Object> extract(String title, String description, String sourceStore) {
        String text = SpecificationUtils.normalize(title + " " + description);

        Map<String, Object> specs = SpecificationUtils.base(
                "power_rms_w",
                "frequency_response_hz",
                "number_of_satellites",
                "signal_to_noise_ratio_db",
                "has_subwoofer",
                "channels",
                "codecs"
        );

        specs.put("power_rms_w", toRequiredInteger(extractPowerRms(text), DEFAULT_POWER_RMS_W));
        specs.put("frequency_response_hz", toRequiredString(extractFrequencyResponse(text), DEFAULT_FREQUENCY_RESPONSE));

        Boolean hasSubwoofer = extractHasSubwoofer(text);
        specs.put("has_subwoofer", hasSubwoofer != null ? hasSubwoofer : false);

        SpecificationUtils.putIfFound(specs, "number_of_satellites", extractNumberOfSatellites(text));
        SpecificationUtils.putIfFound(specs, "signal_to_noise_ratio_db", extractSnrDb(text));
        SpecificationUtils.putIfFound(specs, "channels", extractChannels(text));
        SpecificationUtils.putIfFound(specs, "codecs", extractCodecs(text));

        return specs;
    }

    private static Integer toRequiredInteger(Integer value, Integer fallback) {
        if (value == null || value < 1) {
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

    private static Integer extractPowerRms(String text) {
        Pattern rmsPattern = Pattern.compile(
                "(?:putere\\s+rms|rms\\s+power|putere\\s+nominala|putere\\s+totala)\\s*:?\\s*(\\d+(?:[.,]\\d+)?)\\s*w\\b"
        );
        Matcher rmsMatcher = rmsPattern.matcher(text);
        if (rmsMatcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(rmsMatcher.group(1));
            if (val instanceof Number n) {
                int power = n.intValue();
                if (power >= 1 && power <= 10000) return power;
            }
        }

        Pattern genericPattern = Pattern.compile("\\b(\\d+(?:[.,]\\d+)?)\\s*w\\b");
        Matcher genericMatcher = genericPattern.matcher(text);
        while (genericMatcher.find()) {
            Object val = SpecificationUtils.parseNumberFlexible(genericMatcher.group(1));
            if (val instanceof Number n) {
                int power = n.intValue();
                if (power >= 1 && power <= 10000) return power;
            }
        }

        return null;
    }

    private static String extractFrequencyResponse(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d{1,5})\\s*(?:hz)?\\s*[-–]\\s*(\\d{2,6})\\s*(?:hz|khz)?\\b");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            int low = parseIntSafe(matcher.group(1));
            String highStr = matcher.group(2);
            String unit = matcher.group(0).toLowerCase().contains("khz") ? "khz" : "hz";

            int high = parseIntSafe(highStr);
            if (unit.equals("khz")) {
                high *= 1000;
            }

            if (low >= 10 && low <= 500 && high >= 1000 && high <= 100000 && low < high) {
                return low + "-" + high;
            }
        }

        return null;
    }

    private static Integer extractNumberOfSatellites(String text) {
        Pattern pattern = Pattern.compile("\\b(\\d+)\\s*(?:x\\s*)?satelit(?:i)?\\b");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                int count = Integer.parseInt(matcher.group(1));
                if (count >= 1 && count <= 10) return count;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Integer extractSnrDb(String text) {
        Pattern pattern = Pattern.compile(
                "(?:raport\\s+semnal(?:\\s*[/\\\\]\\s*|\\s+)zgomot|snr|s/n|semnal\\s*/\\s*zgomot)\\s*:?\\s*(\\d+)\\s*db\\b"
        );
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                int snr = Integer.parseInt(matcher.group(1));
                if (snr >= 50 && snr <= 130) return snr;
            } catch (Exception ignored) {}
        }

        Pattern dbPattern = Pattern.compile("\\b(\\d{2,3})\\s*db\\b");
        Matcher dbMatcher = dbPattern.matcher(text);
        while (dbMatcher.find()) {
            try {
                int db = Integer.parseInt(dbMatcher.group(1));
                if (db >= 60 && db <= 120) return db;
            } catch (Exception ignored) {}
        }

        return null;
    }

    private static Boolean extractHasSubwoofer(String text) {
        if (SpecificationUtils.containsAny(text, "subwoofer", "sub-woofer", "difuzor bass", "woofer")) {
            return true;
        }
        if (SpecificationUtils.containsAny(text, "2.0", "stereo", "2 canale") &&
                !SpecificationUtils.containsAny(text, "2.1")) {
            return false;
        }
        return null;
    }

    private static String extractChannels(String text) {
        Pattern pattern = Pattern.compile("\\b([2-9])\\.([01])\\b");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1) + "." + matcher.group(2);
        }
        return null;
    }

    private static List<String> extractCodecs(String text) {
        List<String> found = new ArrayList<>();

        if (SpecificationUtils.containsAny(text, "dolby atmos")) found.add("DOLBY_ATMOS");
        else if (SpecificationUtils.containsAny(text, "dolby truehd")) found.add("DOLBY_TRUEHD");
        else if (SpecificationUtils.containsAny(text, "dolby digital plus", "dolby digital+")) found.add("DOLBY_DIGITAL_PLUS");
        else if (SpecificationUtils.containsAny(text, "dolby digital", "dolby")) found.add("DOLBY_DIGITAL");

        if (SpecificationUtils.containsAny(text, "dts:x", "dts-x")) found.add("DTS_X");
        else if (SpecificationUtils.containsAny(text, "dts-hd ma", "dts hd master")) found.add("DTS_HD_MA");
        else if (SpecificationUtils.containsAny(text, "dts")) found.add("DTS");

        if (SpecificationUtils.containsAny(text, "flac")) found.add("FLAC");
        if (SpecificationUtils.containsAny(text, "alac")) found.add("ALAC");
        if (SpecificationUtils.containsAny(text, "aac")) found.add("AAC");
        if (SpecificationUtils.containsAny(text, "mp3")) found.add("MP3");
        if (SpecificationUtils.containsAny(text, "pcm", "lpcm")) found.add("PCM");
        if (SpecificationUtils.containsAny(text, "wav")) found.add("WAV");

        return found.isEmpty() ? null : found;
    }

    private static int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value.trim());
        } catch (Exception e) {
            return -1;
        }
    }
}