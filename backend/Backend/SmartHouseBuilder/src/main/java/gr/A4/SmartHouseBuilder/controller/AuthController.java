package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.*;
import gr.A4.SmartHouseBuilder.service.AuthService;
import gr.A4.SmartHouseBuilder.service.MfaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;
    private final MfaService mfaService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-mfa")
    public ResponseEntity<AuthResponse> verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyMfa(request));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<MfaSetupResponse> setupMfa(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.setupMfa(userDetails.getUsername()));
    }

    @PostMapping("/mfa/confirm")
    public ResponseEntity<Void> confirmMfa(@AuthenticationPrincipal UserDetails userDetails,
                                           @Valid @RequestBody MfaVerifyRequest request) {
        authService.confirmMfa(userDetails.getUsername(), request.getCode());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/mfa/disable")
    public ResponseEntity<Void> disableMfa(@AuthenticationPrincipal UserDetails userDetails) {
        authService.disableMfa(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody TokenRefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.processForgotPassword(request.email());
        return ResponseEntity.ok("If an account exists with this email, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok("Password has been successfully reset.");
    }


}
