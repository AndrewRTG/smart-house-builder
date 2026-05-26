package gr.A4.SmartHouseBuilder.service.parser.specifications;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AudioSystemSpecificationExtractorTest {

    @Test
    void testExtract_AllValidValues_ContextualPatterns() {
        String title = "Home Cinema 5.1";
        String description = "Putere rms 500 w. Frecventa 20-20 khz. Are 5 sateliti. Raport semnal zgomot 100 db. Include subwoofer. Decodeaza dolby atmos, dts:x, flac, alac, aac, mp3, pcm si wav.";
        Map<String, Object> result = AudioSystemSpecificationExtractor.extract(title, description, "ROVISION");

        assertEquals(500, result.get("power_rms_w"));
        assertEquals("20-20000", result.get("frequency_response_hz"));
        assertEquals(5, result.get("number_of_satellites"));
        assertEquals(100, result.get("signal_to_noise_ratio_db"));
        assertEquals(true, result.get("has_subwoofer"));
        assertEquals("5.1", result.get("channels"));

        @SuppressWarnings("unchecked")
        List<String> codecs = (List<String>) result.get("codecs");
        assertNotNull(codecs);
        assertTrue(codecs.contains("DOLBY_ATMOS"));
        assertTrue(codecs.contains("DTS_X"));
        assertTrue(codecs.contains("FLAC"));
        assertTrue(codecs.contains("ALAC"));
        assertTrue(codecs.contains("AAC"));
        assertTrue(codecs.contains("MP3"));
        assertTrue(codecs.contains("PCM"));
        assertTrue(codecs.contains("WAV"));
    }

    @Test
    void testExtract_GenericPatterns_And_AlternativeCodecs() {
        String title = "Sistem Audio 2.0";
        String description = "Nu mai putin de 15000 w ignorati, dar are 120 w. Frecventa 30 - 15000 hz. Raport de 500 db ignorat, dar are 85 db. " +
                "dolby truehd, dts-hd ma. Stereo.";
        Map<String, Object> result = AudioSystemSpecificationExtractor.extract(title, description, "CASESMART");

        assertEquals(120, result.get("power_rms_w"));
        assertEquals("30-15000", result.get("frequency_response_hz"));
        assertEquals(85, result.get("signal_to_noise_ratio_db"));
        assertEquals(false, result.get("has_subwoofer"));
        assertEquals("2.0", result.get("channels"));

        @SuppressWarnings("unchecked")
        List<String> codecs = (List<String>) result.get("codecs");
        assertTrue(codecs.contains("DOLBY_TRUEHD"));
        assertTrue(codecs.contains("DTS_HD_MA"));
    }

    @Test
    void testExtract_ThirdTierCodecs() {
        String title = "Soundbar";
        String description = "dolby digital plus, dts.";
        Map<String, Object> result = AudioSystemSpecificationExtractor.extract(title, description, "TEST");

        @SuppressWarnings("unchecked")
        List<String> codecs = (List<String>) result.get("codecs");
        assertTrue(codecs.contains("DOLBY_DIGITAL_PLUS"));
        assertTrue(codecs.contains("DTS"));
    }

    @Test
    void testExtract_FourthTierCodecs() {
        String title = "Boxa portabila";
        String description = "dolby digital.";
        Map<String, Object> result = AudioSystemSpecificationExtractor.extract(title, description, "TEST");

        @SuppressWarnings("unchecked")
        List<String> codecs = (List<String>) result.get("codecs");
        assertTrue(codecs.contains("DOLBY_DIGITAL"));
    }

    @Test
    void testExtract_OutOfBounds_And_Fallbacks() {
        String description = "putere rms 0 w, 20 sateliti. Frecventa 5 - 200 hz. raport snr: 40 db.";
        Map<String, Object> result = AudioSystemSpecificationExtractor.extract("Audio", description, "TEST");

        assertEquals(10, result.get("power_rms_w"));
        assertEquals("20-20000", result.get("frequency_response_hz"));
        assertEquals("-", result.get("number_of_satellites"));
        assertEquals("-", result.get("signal_to_noise_ratio_db"));
        assertEquals(false, result.get("has_subwoofer"));
        assertEquals("-", result.get("codecs"));
    }

    @Test
    void testExtract_FrequencyResponse_WhileLoopLogic() {
        String description = "Frecventa 20-500 hz apoi 500-200 hz apoi 20-20 khz.";
        Map<String, Object> result = AudioSystemSpecificationExtractor.extract("Audio", description, "TEST");
        assertEquals("20-20000", result.get("frequency_response_hz"));
    }

    @Test
    void testExtract_TriggersCatchBlocks_NumberFormatExceptions() {
        String title = "Error Test";
        String description = "999999999999999 sateliti. raport snr: 999999999999999 db. 999999999999999 db.";

        Map<String, Object> result = AudioSystemSpecificationExtractor.extract(title, description, "ROVISION");

        assertEquals("-", result.get("number_of_satellites"));
        assertEquals("-", result.get("signal_to_noise_ratio_db"));
    }

    @Test
    void testUnreachableBranches_WithMockedStatic() {
        try (MockedStatic<SpecificationUtils> mockedUtils = Mockito.mockStatic(SpecificationUtils.class, Mockito.CALLS_REAL_METHODS)) {
            mockedUtils.when(() -> SpecificationUtils.parseNumberFlexible(Mockito.anyString()))
                    .thenReturn("NOT_A_NUMBER", 120, "NOT_A_NUMBER", 120);

            Map<String, Object> result = AudioSystemSpecificationExtractor.extract("Audio", "putere rms 50 w. putere rms 120 w. 50 w. 120 w.", "TEST");

            assertEquals(120, result.get("power_rms_w"));
        }
    }

    @Test
    void testUnreachableBranches_InPrivateMethods() throws Exception {
        Method stringMethod = AudioSystemSpecificationExtractor.class.getDeclaredMethod("toRequiredString", String.class, String.class);
        stringMethod.setAccessible(true);
        assertEquals("FALLBACK", stringMethod.invoke(null, "   ", "FALLBACK"));
        assertEquals("FALLBACK", stringMethod.invoke(null, "-", "FALLBACK"));

        Method intMethod = AudioSystemSpecificationExtractor.class.getDeclaredMethod("toRequiredInteger", Integer.class, Integer.class);
        intMethod.setAccessible(true);
        assertEquals(99, intMethod.invoke(null, 0, 99));

        Method parseIntMethod = AudioSystemSpecificationExtractor.class.getDeclaredMethod("parseIntSafe", String.class);
        parseIntMethod.setAccessible(true);
        assertEquals(-1, parseIntMethod.invoke(null, "NOT_A_NUMBER"));
    }

    @Test
    void testConstructor_ForFullCoverage() {
        AudioSystemSpecificationExtractor extractor = new AudioSystemSpecificationExtractor();
        assertNotNull(extractor);
    }
}