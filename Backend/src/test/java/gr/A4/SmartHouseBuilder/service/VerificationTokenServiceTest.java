package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.VerificationToken;
import gr.A4.SmartHouseBuilder.exception.TokenRefreshException;
import gr.A4.SmartHouseBuilder.repository.VerificationTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationTokenServiceTest {

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @InjectMocks
    private VerificationTokenService verificationTokenService;

    @Test
    void createVerificationToken_replacesOldTokenAndPersistsNewOne() {
        User user = User.builder().email("user@example.com").username("user").build();
        when(verificationTokenRepository.save(any(VerificationToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        VerificationToken token = verificationTokenService.createVerificationToken(user);

        verify(verificationTokenRepository).deleteByUser(user);
        assertThat(token.getUser()).isEqualTo(user);
        assertThat(token.getToken()).isNotBlank();
        assertThat(token.getExpiryDate()).isAfter(LocalDateTime.now().plusHours(23));
    }

    @Test
    void findByToken_delegatesToRepository() {
        VerificationToken token = VerificationToken.builder().token("abc").build();
        when(verificationTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        assertThat(verificationTokenService.findByToken("abc")).contains(token);
    }

    @Test
    void verifyExpiration_returnsValidToken() {
        VerificationToken token = VerificationToken.builder()
                .token("valid")
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        assertThat(verificationTokenService.verifyExpiration(token)).isEqualTo(token);
        verify(verificationTokenRepository, never()).delete(any());
    }

    @Test
    void verifyExpiration_deletesExpiredTokenAndThrows() {
        VerificationToken token = VerificationToken.builder()
                .token("expired")
                .expiryDate(LocalDateTime.now().minusSeconds(1))
                .build();

        assertThatThrownBy(() -> verificationTokenService.verifyExpiration(token))
                .isInstanceOf(TokenRefreshException.class)
                .hasMessageContaining("expired");

        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void delete_delegatesToRepository() {
        VerificationToken token = VerificationToken.builder().token("abc").build();

        verificationTokenService.delete(token);

        verify(verificationTokenRepository).delete(token);
    }
}
