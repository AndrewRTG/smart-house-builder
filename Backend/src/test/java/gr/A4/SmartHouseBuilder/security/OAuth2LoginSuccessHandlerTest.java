package gr.A4.SmartHouseBuilder.security;

import gr.A4.SmartHouseBuilder.entity.RefreshToken;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private OAuth2LoginSuccessHandler handler;

    @Test
    void missingEmail_sendsBadRequestAndStops() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(
                new MockHttpServletRequest(),
                response,
                oauthToken(Map.of("name", "No Email User", "sub", "oauth-1"), "google"));

        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getErrorMessage()).contains("Email not found");
        verify(userRepository, never()).findByEmail(any());
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void existingUser_redirectsWithAccessAndRefreshTokens() throws Exception {
        User existing = User.builder().id(3L).email("user@example.com").username("existing").build();
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));
        when(jwtUtil.generateToken("user@example.com")).thenReturn("access.token");
        when(refreshTokenService.createRefreshToken(existing))
                .thenReturn(RefreshToken.builder().token("family:refresh token").build());

        handler.onAuthenticationSuccess(
                new MockHttpServletRequest(),
                response,
                oauthToken(Map.of("email", "user@example.com", "name", "Existing User", "sub", "oauth-1"), "google"));

        assertThat(response.getStatus()).isEqualTo(302);
        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:5173/oauth2/callback?token=access.token&refreshToken=family%3Arefresh+token");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void newOAuthUser_isSavedWithProviderAndVerifiedFlag() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken("new@example.com")).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(any(User.class)))
                .thenReturn(RefreshToken.builder().token("refresh-token").build());

        handler.onAuthenticationSuccess(
                new MockHttpServletRequest(),
                response,
                oauthToken(Map.of("email", "new@example.com", "name", "New User", "sub", "oauth-42"), "google"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User savedUser = captor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("new@example.com");
        assertThat(savedUser.getUsername()).isEqualTo("New User");
        assertThat(savedUser.getProvider()).isEqualTo("google");
        assertThat(savedUser.getProviderId()).isEqualTo("oauth-42");
        assertThat(savedUser.isVerified()).isTrue();
        assertThat(savedUser.getPassword()).isNull();
        assertThat(response.getRedirectedUrl()).contains("token=access-token");
    }

    @Test
    void nonOAuth2Authentication_usesUnknownProviderForNewUser() throws Exception {
        OAuth2User oauth2User = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("email", "unknown@example.com", "name", "Unknown Provider User", "sub", "oauth-77"),
                "sub");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken("unknown@example.com")).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(any(User.class)))
                .thenReturn(RefreshToken.builder().token("refresh-token").build());

        handler.onAuthenticationSuccess(
                new MockHttpServletRequest(),
                response,
                new TestingAuthenticationToken(oauth2User, null));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getProvider()).isEqualTo("unknown");
        assertThat(response.getRedirectedUrl()).contains("refreshToken=refresh-token");
    }

    private OAuth2AuthenticationToken oauthToken(Map<String, Object> attributes, String registrationId) {
        OAuth2User oauth2User = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "sub");
        return new OAuth2AuthenticationToken(oauth2User, oauth2User.getAuthorities(), registrationId);
    }
}
