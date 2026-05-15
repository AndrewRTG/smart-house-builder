package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.RefreshToken;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.exception.TokenRefreshException;
import gr.A4.SmartHouseBuilder.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationMs", 3_600_000L);
    }

    @Test
    void createRefreshToken_generatesTokenAndPersistsIt() {
        User user = User.builder().email("user@example.com").username("user").build();
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken token = refreshTokenService.createRefreshToken(user);

        assertThat(token.getUser()).isEqualTo(user);
        assertThat(token.getFamilyId()).isNotBlank();
        assertThat(token.getToken()).startsWith(token.getFamilyId() + ":");
        assertThat(token.getExpiryDate()).isAfter(LocalDateTime.now().plusMinutes(59));
    }

    @Test
    void createRefreshToken_withExplicitFamilyIdReusesThatFamily() {
        User user = User.builder().email("user@example.com").username("user").build();
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken token = refreshTokenService.createRefreshToken(user, "family-123");

        assertThat(token.getFamilyId()).isEqualTo("family-123");
        assertThat(token.getToken()).startsWith("family-123:");
    }

    @Test
    void extractFamilyId_returnsFamilyPrefixWhenFormatIsValid() {
        assertThat(refreshTokenService.extractFamilyId("family-123:random-part"))
                .contains("family-123");
        assertThat(refreshTokenService.extractFamilyId("invalid-token"))
                .isEmpty();
    }

    @Test
    void findByToken_delegatesToRepository() {
        RefreshToken token = RefreshToken.builder().token("family:token").build();
        when(refreshTokenRepository.findByToken("family:token")).thenReturn(Optional.of(token));

        assertThat(refreshTokenService.findByToken("family:token")).contains(token);
    }

    @Test
    void familyExists_delegatesToRepository() {
        when(refreshTokenRepository.existsByFamilyId("family-123")).thenReturn(true);

        assertThat(refreshTokenService.familyExists("family-123")).isTrue();
    }

    @Test
    void invalidateFamily_deletesAllTokensInFamily() {
        refreshTokenService.invalidateFamily("family-123");

        verify(refreshTokenRepository).deleteByFamilyId("family-123");
    }

    @Test
    void verifyExpiration_returnsValidTokenUnchanged() {
        RefreshToken token = RefreshToken.builder()
                .token("family:token")
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .build();

        assertThat(refreshTokenService.verifyExpiration(token)).isEqualTo(token);
        verify(refreshTokenRepository, never()).delete(any());
    }

    @Test
    void verifyExpiration_deletesExpiredTokenAndThrows() {
        RefreshToken token = RefreshToken.builder()
                .token("family:token")
                .expiryDate(LocalDateTime.now().minusSeconds(1))
                .build();

        assertThatThrownBy(() -> refreshTokenService.verifyExpiration(token))
                .isInstanceOf(TokenRefreshException.class)
                .hasMessageContaining("expired");

        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void deleteToken_deletesSingleToken() {
        RefreshToken token = RefreshToken.builder().token("family:token").build();

        refreshTokenService.deleteToken(token);

        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void deleteByUser_deletesAllTokensForUser() {
        User user = User.builder().email("user@example.com").username("user").build();

        refreshTokenService.deleteByUser(user);

        verify(refreshTokenRepository).deleteByUser(user);
    }
}
