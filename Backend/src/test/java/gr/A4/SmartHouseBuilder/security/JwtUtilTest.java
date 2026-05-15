package gr.A4.SmartHouseBuilder.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        String secret = Base64.getEncoder().encodeToString(
                "this-is-a-very-long-secret-key-for-jwt-tests-1234567890".getBytes(StandardCharsets.UTF_8)
        );
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", secret);
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 3_600_000L);
    }

    @Test
    void generateToken_extractsEmailAndValidates() {
        String token = jwtUtil.generateToken("user@example.com");

        assertThat(jwtUtil.validateToken(token)).isTrue();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("user@example.com");
        assertThat(jwtUtil.isMfaToken(token)).isFalse();
    }

    @Test
    void generateMfaToken_marksTokenAsMfaChallenge() {
        String token = jwtUtil.generateMfaToken("mfa@example.com");

        assertThat(jwtUtil.validateToken(token)).isTrue();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("mfa@example.com");
        assertThat(jwtUtil.isMfaToken(token)).isTrue();
    }

    @Test
    void invalidTokenIsRejected() {
        assertThat(jwtUtil.validateToken("not-a-jwt")).isFalse();
        assertThat(jwtUtil.isMfaToken("not-a-jwt")).isFalse();
    }
}
