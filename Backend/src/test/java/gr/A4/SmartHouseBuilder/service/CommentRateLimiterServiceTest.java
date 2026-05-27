package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.exception.TooManyCommentsException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CommentRateLimiterServiceTest {

    @Test
    void allowsFiveCommentsPerUserThenRejectsTheSixth() {
        CommentRateLimiterService limiter = new CommentRateLimiterService();

        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> limiter.checkLimit("ana@example.com")).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> limiter.checkLimit("ana@example.com"))
                .isInstanceOf(TooManyCommentsException.class)
                .hasMessageContaining("prea multe comentarii");
    }

    @Test
    void keepsSeparateBucketsPerEmailAndForAnonymousUsers() {
        CommentRateLimiterService limiter = new CommentRateLimiterService();

        for (int i = 0; i < 5; i++) {
            limiter.checkLimit("ana@example.com");
        }

        assertThatCode(() -> limiter.checkLimit("bob@example.com")).doesNotThrowAnyException();

        for (int i = 0; i < 5; i++) {
            limiter.checkLimit(null);
        }

        assertThatThrownBy(() -> limiter.checkLimit(null))
                .isInstanceOf(TooManyCommentsException.class);
    }
}
