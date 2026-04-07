package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.VerificationToken;
import gr.A4.SmartHouseBuilder.exception.TokenRefreshException;
import gr.A4.SmartHouseBuilder.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationTokenService {

    private final VerificationTokenRepository verificationTokenRepository;

    private static final long EXPIRY_HOURS = 24;

    @Transactional
    public VerificationToken createVerificationToken(User user) {
        verificationTokenRepository.deleteByUser(user);
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusHours(EXPIRY_HOURS))
                .build();
        return verificationTokenRepository.save(token);
    }

    public Optional<VerificationToken> findByToken(String token) {
        return verificationTokenRepository.findByToken(token);
    }

    public VerificationToken verifyExpiration(VerificationToken token) {
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(token);
            throw new TokenRefreshException("Verification link has expired. Please register again.");
        }
        return token;
    }

    @Transactional
    public void delete(VerificationToken token) {
        verificationTokenRepository.delete(token);
    }
}
