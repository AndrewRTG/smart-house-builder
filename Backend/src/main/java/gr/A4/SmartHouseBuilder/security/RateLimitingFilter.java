package gr.A4.SmartHouseBuilder.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Default raised from 10 to 60 because a single page navigation in the
    // SPA legitimately fires multiple /auth/* calls (Navbar, ProfilePage,
    // CommunityPage, SetupDetailPage all read /auth/me on mount; React 18
    // StrictMode runs every effect twice in dev). 10/min was triggering
    // 429s during normal use and silently blanking out the user state.
    @Value("${app.rate-limit.capacity:60}")
    private int capacity;

    @Value("${app.rate-limit.minutes:1}")
    private int minutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }
        // Read-only / availability endpoints don't have brute-force risk and
        // are called many times per page navigation. Excluding them keeps
        // the limiter focused on the *write* surfaces (login, register,
        // verify-mfa, forgot-password, reset-password) where rate-limiting
        // actually matters.
        if (path.equals("/api/v1/auth/me")
                || path.equals("/api/v1/auth/check-username")
                || path.equals("/api/v1/auth/refresh")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = resolveClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(ip, k -> newBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\": \"Too many requests. Please try again later.\"}");
        }


        if (!path.startsWith("/api/v1/auth/") && !path.startsWith("/api/v1/notifications/")) {
            filterChain.doFilter(request, response);
            return;
        }
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillIntervally(capacity, Duration.ofMinutes(minutes))
                        .build())
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
