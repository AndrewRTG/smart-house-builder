package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.RefreshToken;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.exception.TokenRefreshException;
import gr.A4.SmartHouseBuilder.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // New login — starts a fresh family
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        return createRefreshToken(user, UUID.randomUUID().toString());
    }

    // Rotation — continues the same family
    @Transactional
    public RefreshToken createRefreshToken(User user, String familyId) {
        // Token value encodes the familyId so it is recoverable even after the row is deleted.
        // Format: "<familyId>:<randomUUID>"
        String tokenValue = familyId + ":" + UUID.randomUUID();
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .familyId(familyId)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .build();
        return refreshTokenRepository.save(token);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    // Extracts the familyId from an encoded token value without a DB lookup.
    // Returns empty if the token is not in the expected format.
    public Optional<String> extractFamilyId(String tokenValue) {
        String[] parts = tokenValue.split(":", 2);
        return parts.length == 2 ? Optional.of(parts[0]) : Optional.empty();
    }

    public boolean familyExists(String familyId) {
        return refreshTokenRepository.existsByFamilyId(familyId);
    }

    @Transactional
    public void invalidateFamily(String familyId) {
        refreshTokenRepository.deleteByFamilyId(familyId);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException("Refresh token has expired. Please log in again.");
        }
        return token;
    }

    @Transactional
    public void deleteToken(RefreshToken token) {
        refreshTokenRepository.delete(token);
    }

    @Transactional
    public void deleteByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}
