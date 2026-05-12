package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.repository.RefreshTokenRepository;
import gr.A4.SmartHouseBuilder.repository.VerificationTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TokenCleanupServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @InjectMocks
    private TokenCleanupService tokenCleanupService;

    @Test
    void purgeExpiredTokens_deletesExpiredRowsInBothRepositories() {
        tokenCleanupService.purgeExpiredTokens();

        verify(refreshTokenRepository).deleteAllExpiredBefore(any(LocalDateTime.class));
        verify(verificationTokenRepository).deleteAllExpiredBefore(any(LocalDateTime.class));
    }
}
