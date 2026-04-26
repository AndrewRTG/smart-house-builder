package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.repository.RefreshTokenRepository;
import gr.A4.SmartHouseBuilder.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TokenCleanupService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationTokenRepository verificationTokenRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.deleteAllExpiredBefore(now);
        verificationTokenRepository.deleteAllExpiredBefore(now);
    }
}
