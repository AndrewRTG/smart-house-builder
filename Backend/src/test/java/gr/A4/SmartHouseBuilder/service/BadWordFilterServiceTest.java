package gr.A4.SmartHouseBuilder.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BadWordFilterServiceTest {

    private final BadWordFilterService service = new BadWordFilterService();

    @Test
    void ignoresNullBlankAndCleanText() {
        assertThat(service.containsBadWords(null)).isFalse();
        assertThat(service.containsBadWords("   ")).isFalse();
        assertThat(service.containsBadWords("Smart lighting for a quiet living room")).isFalse();
    }

    @Test
    void detectsWholeWordsAfterNormalizingCaseAndPunctuation() {
        assertThat(service.containsBadWords("This contains BADWORD inside the sentence")).isTrue();
        assertThat(service.containsBadWords("prefix-badword-suffix")).isTrue();
    }

    @Test
    void detectsNormalizedRomanianDiacriticsAndPhrases() {
        assertThat(service.containsBadWords("Ai folosit cuv\u00e2ntinterzis aici")).isTrue();
        assertThat(service.containsBadWords("text cu insulta scris cu punctuatie")).isTrue();
    }

    @Test
    void doesNotMatchBadWordsInsideLargerCleanTokens() {
        assertThat(service.containsBadWords("badwording is a larger token after normalization")).isFalse();
    }
}
