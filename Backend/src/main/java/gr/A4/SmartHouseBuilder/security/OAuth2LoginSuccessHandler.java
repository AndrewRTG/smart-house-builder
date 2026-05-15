package gr.A4.SmartHouseBuilder.security;

import gr.A4.SmartHouseBuilder.entity.RefreshToken;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 success bridge.
 *
 * After Spring Security finishes the OAuth2 dance with Google or Facebook,
 * this handler runs once. It:
 *   1. Reads the email from the provider profile.
 *   2. Looks up (or creates) a local User row, setting provider correctly
 *      based on the registrationId — NOT hardcoded to "google" anymore.
 *   3. Issues BOTH a JWT access token AND a refresh token. The previous
 *      version sent only the access token, which meant OAuth users got a
 *      single ~15-minute session because authFetch on the frontend had
 *      nothing to refresh against. Now both flow through the redirect URL
 *      and OAuthCallbackPage stores both, putting OAuth on parity with the
 *      password-login flow.
 *   4. Redirects to the SPA at /oauth2/callback with both tokens as query
 *      params.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from provider");
            return;
        }

        // Spring stores the active client registration id ("google",
        // "facebook", "github", ...) on the OAuth2AuthenticationToken. We
        // used to hardcode "google" here which would silently mis-tag every
        // Facebook account as Google in the analytics column.
        String provider = "unknown";
        if (authentication instanceof OAuth2AuthenticationToken oauthAuth) {
            provider = oauthAuth.getAuthorizedClientRegistrationId();
        }

        final String providerName = provider;
        User user = userRepository.findByEmail(email).orElseGet(() -> userRepository.save(
                User.builder()
                        .email(email)
                        .username(oauth2User.getAttribute("name"))
                        .provider(providerName)
                        .providerId(oauth2User.getName())
                        .password(null)
                        // OAuth users are pre-verified — the provider already
                        // confirmed their email. Without this they'd hit
                        // EmailNotVerifiedException on the next /auth/login.
                        .verified(true)
                        .build()));

        String accessToken = jwtUtil.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        log.info("OAuth login success for {} via {}", email, providerName);

        // Both tokens flow back as query params. URL-encoded so JWT special
        // characters (rare, but possible in the signature segment) survive.
        String redirect = "http://localhost:5173/oauth2/callback"
                + "?token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
                + "&refreshToken=" + URLEncoder.encode(refreshToken.getToken(), StandardCharsets.UTF_8);
        response.sendRedirect(redirect);
    }
}
