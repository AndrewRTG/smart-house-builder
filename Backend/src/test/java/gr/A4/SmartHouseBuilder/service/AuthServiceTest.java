package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.AuthResponse;
import gr.A4.SmartHouseBuilder.dto.LoginRequest;
import gr.A4.SmartHouseBuilder.dto.MfaChallengeResponse;
import gr.A4.SmartHouseBuilder.dto.MfaSetupResponse;
import gr.A4.SmartHouseBuilder.dto.MfaVerifyRequest;
import gr.A4.SmartHouseBuilder.dto.RegisterRequest;
import gr.A4.SmartHouseBuilder.dto.UserProfileResponse;
import gr.A4.SmartHouseBuilder.entity.RefreshToken;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.VerificationToken;
import gr.A4.SmartHouseBuilder.exception.EmailAlreadyRegisteredException;
import gr.A4.SmartHouseBuilder.exception.EmailNotVerifiedException;
import gr.A4.SmartHouseBuilder.exception.MfaCodeInvalidException;
import gr.A4.SmartHouseBuilder.exception.UsernameAlreadyTakenException;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private VerificationTokenService verificationTokenService;
    @Mock private EmailService emailService;
    @Mock private MfaService mfaService;
    @Mock private S3Service s3Service;

    @InjectMocks private AuthService authService;

    private RegisterRequest sampleRegister() {
        return RegisterRequest.builder()
                .email("new@example.com")
                .username("newuser")
                .password("Str0ng!Pass")
                .build();
    }

    @Test
    void register_savesUserAndReturnsTokens() {
        RegisterRequest req = sampleRegister();
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("Str0ng!Pass")).thenReturn("hashed");

        VerificationToken vt = new VerificationToken();
        vt.setToken("verify-token");
        when(verificationTokenService.createVerificationToken(any(User.class))).thenReturn(vt);
        RefreshToken rt = new RefreshToken();
        rt.setToken("refresh-token");
        when(refreshTokenService.createRefreshToken(any(User.class))).thenReturn(rt);
        when(jwtUtil.generateToken("new@example.com")).thenReturn("access-token");

        AuthResponse response = authService.register(req);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getEmail()).isEqualTo("new@example.com");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("hashed");
        assertThat(userCaptor.getValue().getProvider()).isEqualTo("local");
        verify(emailService).sendVerificationEmail("new@example.com", "verify-token");
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        when(userRepository.findByEmail("new@example.com"))
                .thenReturn(Optional.of(User.builder().email("new@example.com").build()));

        assertThatThrownBy(() -> authService.register(sampleRegister()))
                .isInstanceOf(EmailAlreadyRegisteredException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenUsernameAlreadyTaken() {
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(sampleRegister()))
                .isInstanceOf(UsernameAlreadyTakenException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_returnsTokensWhenVerifiedAndNoMfa() {
        LoginRequest req = new LoginRequest();
        req.setIdentifier("user@example.com");
        req.setPassword("pw");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getName()).thenReturn("user@example.com");
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        User user = User.builder().id(1L).email("user@example.com").username("u").verified(true).mfaEnabled(false).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        RefreshToken rt = new RefreshToken();
        rt.setToken("refresh-token");
        when(refreshTokenService.createRefreshToken(user)).thenReturn(rt);
        when(jwtUtil.generateToken("user@example.com")).thenReturn("access-token");

        Object response = authService.login(req);

        assertThat(response).isInstanceOf(AuthResponse.class);
        AuthResponse ar = (AuthResponse) response;
        assertThat(ar.getAccessToken()).isEqualTo("access-token");
        assertThat(ar.getRefreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void login_throwsWhenAccountUnverified() {
        LoginRequest req = new LoginRequest();
        req.setIdentifier("user@example.com");
        req.setPassword("pw");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getName()).thenReturn("user@example.com");
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userRepository.findByEmail("user@example.com"))
                .thenReturn(Optional.of(User.builder().email("user@example.com").verified(false).build()));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(EmailNotVerifiedException.class);
        verify(refreshTokenService, never()).createRefreshToken(any(User.class));
    }

    @Test
    void login_returnsMfaChallengeWhenMfaEnabled() {
        LoginRequest req = new LoginRequest();
        req.setIdentifier("user@example.com");
        req.setPassword("pw");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getName()).thenReturn("user@example.com");
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        User user = User.builder().email("user@example.com").verified(true).mfaEnabled(true).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateMfaToken("user@example.com")).thenReturn("mfa-token");

        Object response = authService.login(req);

        assertThat(response).isInstanceOf(MfaChallengeResponse.class);
        assertThat(((MfaChallengeResponse) response).getMfaToken()).isEqualTo("mfa-token");
        verify(refreshTokenService, never()).createRefreshToken(any(User.class));
    }

    @Test
    void verifyMfa_throwsOnInvalidMfaJwt() {
        MfaVerifyRequest req = new MfaVerifyRequest();
        req.setMfaToken("bad");
        req.setCode("123456");
        when(jwtUtil.validateToken("bad")).thenReturn(false);

        assertThatThrownBy(() -> authService.verifyMfa(req))
                .isInstanceOf(MfaCodeInvalidException.class);
    }

    @Test
    void verifyMfa_returnsTokensWhenCodeIsCorrect() {
        MfaVerifyRequest req = new MfaVerifyRequest();
        req.setMfaToken("ok");
        req.setCode("123456");
        when(jwtUtil.validateToken("ok")).thenReturn(true);
        when(jwtUtil.isMfaToken("ok")).thenReturn(true);
        when(jwtUtil.extractEmail("ok")).thenReturn("user@example.com");

        User user = User.builder().email("user@example.com").mfaEnabled(true).mfaSecret("S").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(mfaService.verifyCode("S", "123456")).thenReturn(true);

        RefreshToken rt = new RefreshToken();
        rt.setToken("refresh");
        when(refreshTokenService.createRefreshToken(user)).thenReturn(rt);
        when(jwtUtil.generateToken("user@example.com")).thenReturn("access");

        AuthResponse response = authService.verifyMfa(req);
        assertThat(response.getAccessToken()).isEqualTo("access");
        assertThat(response.getRefreshToken()).isEqualTo("refresh");
    }

    @Test
    void setupMfa_generatesSecretAndPersistsIt() {
        User user = User.builder().email("user@example.com").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(mfaService.generateSecret()).thenReturn("SECRET");
        when(mfaService.generateQrCodeUri("SECRET", "user@example.com")).thenReturn("otpauth://...");

        MfaSetupResponse response = authService.setupMfa("user@example.com");

        assertThat(response.getSecret()).isEqualTo("SECRET");
        assertThat(user.getMfaSecret()).isEqualTo("SECRET");
        verify(userRepository).save(user);
    }

    @Test
    void confirmMfa_enablesMfaWhenCodeValid() {
        User user = User.builder().email("user@example.com").mfaSecret("S").mfaEnabled(false).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(mfaService.verifyCode("S", "111111")).thenReturn(true);

        authService.confirmMfa("user@example.com", "111111");

        assertThat(user.isMfaEnabled()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    void confirmMfa_throwsWhenCodeWrong() {
        User user = User.builder().email("user@example.com").mfaSecret("S").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(mfaService.verifyCode("S", "000000")).thenReturn(false);

        assertThatThrownBy(() -> authService.confirmMfa("user@example.com", "000000"))
                .isInstanceOf(MfaCodeInvalidException.class);
        assertThat(user.isMfaEnabled()).isFalse();
    }

    @Test
    void disableMfa_clearsFlagAndSecret() {
        User user = User.builder().email("u@e").mfaEnabled(true).mfaSecret("S").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        authService.disableMfa("u@e");

        assertThat(user.isMfaEnabled()).isFalse();
        assertThat(user.getMfaSecret()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    void updateUsername_savesNewValue() {
        User user = User.builder().email("u@e").username("old").build();
        when(userRepository.existsByUsername("new")).thenReturn(false);
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        UserProfileResponse response = authService.updateUsername("u@e", "new");

        assertThat(response.getUsername()).isEqualTo("new");
        assertThat(user.getUsername()).isEqualTo("new");
        verify(userRepository).save(user);
    }

    @Test
    void updateUsername_throwsOnDuplicate() {
        when(userRepository.existsByUsername("taken")).thenReturn(true);
        assertThatThrownBy(() -> authService.updateUsername("u@e", "taken"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already taken");
    }

    @Test
    void updateUsername_throwsOnBlank() {
        assertThatThrownBy(() -> authService.updateUsername("u@e", "  "))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot be empty");
    }

    @Test
    void updateEmail_savesNewValue() {
        User user = User.builder().email("u@e").build();
        when(userRepository.findByEmail("new@e")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        UserProfileResponse response = authService.updateEmail("u@e", "new@e");

        assertThat(response.getEmail()).isEqualTo("new@e");
        assertThat(user.getEmail()).isEqualTo("new@e");
        verify(userRepository).save(user);
    }

    @Test
    void updateEmail_throwsWhenAlreadyUsed() {
        when(userRepository.findByEmail("dup@e"))
                .thenReturn(Optional.of(User.builder().email("dup@e").build()));
        assertThatThrownBy(() -> authService.updateEmail("u@e", "dup@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already in use");
    }

    @Test
    void toggleMfa_flipsTheFlagBothWays() {
        User user = User.builder().email("u@e").mfaEnabled(false).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        UserProfileResponse on = authService.toggleMfa("u@e");
        assertThat(on.getMfaEnabled()).isTrue();
        assertThat(user.isMfaEnabled()).isTrue();

        UserProfileResponse off = authService.toggleMfa("u@e");
        assertThat(off.getMfaEnabled()).isFalse();
        assertThat(user.getMfaSecret()).isNull();
    }

    @Test
    void usernameExists_delegatesToRepository() {
        when(userRepository.existsByUsername("alex")).thenReturn(true);
        assertThat(authService.usernameExists("alex")).isTrue();
    }

    @Test
    void getCurrentUser_returnsProfile() {
        User user = User.builder().id(1L).email("u@e").username("u").verified(true).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        UserProfileResponse profile = authService.getCurrentUser("u@e");

        assertThat(profile.getId()).isEqualTo(1L);
        assertThat(profile.getUsername()).isEqualTo("u");
    }

    @Test
    void getCurrentUser_throwsWhenUserMissing() {
        when(userRepository.findByEmail("missing@e")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.getCurrentUser("missing@e"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void updateAvatar_deletesOldS3ObjectAndSaves() {
        User user = User.builder().email("u@e").avatarUrl("https://s3/old.jpg").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        UserProfileResponse profile = authService.updateAvatar("u@e", "https://s3/new.jpg");

        verify(s3Service).deleteByUrl("https://s3/old.jpg");
        assertThat(user.getAvatarUrl()).isEqualTo("https://s3/new.jpg");
        assertThat(profile.getAvatarUrl()).isEqualTo("https://s3/new.jpg");
    }

    @Test
    void resetPassword_throwsWhenTokenInvalid() {
        when(userRepository.findByResetToken("bad")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.resetPassword("bad", "Str0ng!Pass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid password reset token");
    }

    @Test
    void resetPassword_throwsWhenTokenExpired() {
        User user = User.builder().email("u@e")
                .resetToken("t")
                .resetTokenExpiry(java.time.LocalDateTime.now().minusHours(1))
                .build();
        when(userRepository.findByResetToken("t")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword("t", "Str0ng!Pass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void resetPassword_succeedsAndClearsToken() {
        User user = User.builder().email("u@e")
                .resetToken("t")
                .resetTokenExpiry(java.time.LocalDateTime.now().plusHours(1))
                .build();
        when(userRepository.findByResetToken("t")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("Str0ng!Pass")).thenReturn("hashed");

        authService.resetPassword("t", "Str0ng!Pass");

        assertThat(user.getPassword()).isEqualTo("hashed");
        assertThat(user.getResetToken()).isNull();
        assertThat(user.getResetTokenExpiry()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    void logout_deletesRefreshTokenWhenPresent() {
        RefreshToken token = new RefreshToken();
        when(refreshTokenService.findByToken("rt")).thenReturn(Optional.of(token));

        authService.logout("rt");

        verify(refreshTokenService).deleteToken(token);
    }

    @Test
    void logout_doesNothingWhenTokenMissing() {
        when(refreshTokenService.findByToken("missing")).thenReturn(Optional.empty());
        authService.logout("missing");
        verify(refreshTokenService, never()).deleteToken(any());
    }

    @Test
    void processForgotPassword_storesTokenAndSendsEmail() {
        User user = User.builder().email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));

        authService.processForgotPassword("u@e");

        assertThat(user.getResetToken()).isNotBlank();
        assertThat(user.getResetTokenExpiry()).isAfter(java.time.LocalDateTime.now());
        verify(emailService).sendResetPasswordEmail(eq("u@e"), anyString());
    }
}
