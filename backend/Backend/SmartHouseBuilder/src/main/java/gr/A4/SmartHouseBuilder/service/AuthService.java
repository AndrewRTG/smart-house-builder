package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.*;
import gr.A4.SmartHouseBuilder.entity.RefreshToken;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.VerificationToken;
import gr.A4.SmartHouseBuilder.exception.*;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final VerificationTokenService verificationTokenService;
    private final EmailService emailService;
    private final MfaService mfaService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new EmailAlreadyRegisteredException(request.getEmail());
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyTakenException(request.getUsername());
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider("local")
                .build();

        userRepository.save(user);

        VerificationToken verificationToken = verificationTokenService.createVerificationToken(user);
        emailService.sendVerificationEmail(user.getEmail(), verificationToken.getToken());

        // Return tokens immediately so the user can start using the app,
        // but protected endpoints can enforce verified=true if needed.
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateToken(user.getEmail()))
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    public Object login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
        );

        // Spring Security already resolved the identifier to an email via UserDetailsServiceImpl.
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        if (!user.isVerified()) {
            throw new EmailNotVerifiedException(user.getEmail());
        }

        if (user.isMfaEnabled()) {
            // Don't issue full tokens yet — return an MFA challenge
            log.info("MFA required for user: {}", email);
            return MfaChallengeResponse.builder()
                    .mfaRequired(true)
                    .mfaToken(jwtUtil.generateMfaToken(user.getEmail()))
                    .build();
        }

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateToken(user.getEmail()))
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    @Transactional
    public void verifyEmail(String tokenValue) {
        VerificationToken token = verificationTokenService.findByToken(tokenValue)
                .orElseThrow(() -> new TokenRefreshException("Invalid verification token."));

        verificationTokenService.verifyExpiration(token);

        User user = token.getUser();
        user.setVerified(true);
        userRepository.save(user);
        verificationTokenService.delete(token);
    }

    @Transactional
    public AuthResponse verifyMfa(MfaVerifyRequest request) {
        if (!jwtUtil.validateToken(request.getMfaToken()) || !jwtUtil.isMfaToken(request.getMfaToken())) {
            throw new MfaCodeInvalidException();
        }

        String email = jwtUtil.extractEmail(request.getMfaToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        if (!mfaService.verifyCode(user.getMfaSecret(), request.getCode())) {
            log.warn("MFA verification failed for user: {}", email);
            throw new MfaCodeInvalidException();
        }

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateToken(user.getEmail()))
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    @Transactional
    public MfaSetupResponse setupMfa(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        String secret = mfaService.generateSecret();
        user.setMfaSecret(secret);
        userRepository.save(user);

        return MfaSetupResponse.builder()
                .secret(secret)
                .qrCodeUri(mfaService.generateQrCodeUri(secret, email))
                .build();
    }

    @Transactional
    public void confirmMfa(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        if (!mfaService.verifyCode(user.getMfaSecret(), code)) {
            log.warn("MFA verification failed for user: {}", email);
            throw new MfaCodeInvalidException();
        }

        user.setMfaEnabled(true);
        userRepository.save(user);
        log.info("MFA enabled for user: {}", email);
    }

    @Transactional
    public void disableMfa(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
        log.info("MFA disabled for user: {}", email);
    }

    @Transactional
    public AuthResponse refreshToken(String requestToken) {
        return refreshTokenService.findByToken(requestToken)
                .map(token -> {
                    refreshTokenService.verifyExpiration(token);
                    User user = token.getUser();
                    String familyId = token.getFamilyId();
                    refreshTokenService.deleteToken(token);
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user, familyId);
                    return AuthResponse.builder()
                            .accessToken(jwtUtil.generateToken(user.getEmail()))
                            .refreshToken(newRefreshToken.getToken())
                            .email(user.getEmail())
                            .username(user.getUsername())
                            .build();
                })
                .orElseGet(() -> {
                    refreshTokenService.extractFamilyId(requestToken)
                            .filter(refreshTokenService::familyExists)
                            .ifPresent(refreshTokenService::invalidateFamily);
                    throw new TokenRefreshException("Invalid refresh token. Please log in again.");
                });
    }

    @Transactional
    public void logout(String requestToken) {
        refreshTokenService.findByToken(requestToken)
                .ifPresent(refreshTokenService::deleteToken);
    }

    @Transactional
    public void processForgotPassword(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilizatorul nu a fost găsit!"));


        String token = java.util.UUID.randomUUID().toString();


        user.setResetToken(token);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
        userRepository.save(user);


        emailService.sendResetPasswordEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Cod de resetare invalid!"));


        if (user.getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Codul de resetare a expirat!");
        }


        user.setPassword(passwordEncoder.encode(newPassword));


        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);
    }
}