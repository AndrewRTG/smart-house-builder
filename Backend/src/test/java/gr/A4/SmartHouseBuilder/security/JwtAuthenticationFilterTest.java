package gr.A4.SmartHouseBuilder.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void missingAuthorizationHeader_leavesContextEmptyAndContinues() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/setups");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verify(jwtUtil, never()).validateToken(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void nonBearerAuthorizationHeader_isIgnored() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/setups");
        request.addHeader("Authorization", "Basic abc123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verify(jwtUtil, never()).validateToken(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void invalidBearerToken_doesNotAuthenticateUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/setups");
        request.addHeader("Authorization", "Bearer invalid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        when(jwtUtil.validateToken("invalid-token")).thenReturn(false);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(chain.getRequest()).isNotNull();
        verify(userDetailsService, never()).loadUserByUsername(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void validBearerToken_authenticatesResolvedUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/setups");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        UserDetails userDetails = User.withUsername("user@example.com")
                .password("pw")
                .authorities("ROLE_USER")
                .build();
        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.extractEmail("valid-token")).thenReturn("user@example.com");
        when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);

        filter.doFilter(request, response, chain);

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo(userDetails);
        assertThat(authentication.getDetails()).isNotNull();
        assertThat(chain.getRequest()).isNotNull();
    }
}
