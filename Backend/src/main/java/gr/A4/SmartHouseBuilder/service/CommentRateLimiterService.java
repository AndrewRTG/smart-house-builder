package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.exception.TooManyCommentsException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CommentRateLimiterService {
    private static final int MAX_COMMENTS = 5;
    private static final int WINDOW_MINUTES = 1;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public void checkLimit(String email) {
        String key = email == null ? "anonymous" : email;
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> createBucket());

        if (!bucket.tryConsume(1)) {
            throw new TooManyCommentsException("Ai trimis prea multe comentarii. Incearca din nou peste un minut.");
        }
    }

    private Bucket createBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_COMMENTS)
                        .refillIntervally(MAX_COMMENTS, Duration.ofMinutes(WINDOW_MINUTES))
                        .build())
                .build();
    }
}