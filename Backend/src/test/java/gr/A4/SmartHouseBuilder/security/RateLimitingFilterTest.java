package gr.A4.SmartHouseBuilder.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingFilterTest {

    private RateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
        ReflectionTestUtils.setField(filter, "capacity", 1);
        ReflectionTestUtils.setField(filter, "minutes", 1);
    }

    @Test
    void nonAuthPathBypassesRateLimiting() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/articles");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void excludedAuthPathBypassesRateLimiting() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/me");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void refreshAndUsernameAvailabilityBypassEvenAfterIpIsLimited() throws Exception {
        MockHttpServletRequest firstRequest = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        firstRequest.setRemoteAddr("10.0.0.6");
        filter.doFilter(firstRequest, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletRequest refreshRequest = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
        refreshRequest.setRemoteAddr("10.0.0.6");
        MockHttpServletResponse refreshResponse = new MockHttpServletResponse();
        MockFilterChain refreshChain = new MockFilterChain();

        filter.doFilter(refreshRequest, refreshResponse, refreshChain);

        MockHttpServletRequest usernameRequest = new MockHttpServletRequest("GET", "/api/v1/auth/check-username");
        usernameRequest.setRemoteAddr("10.0.0.6");
        MockHttpServletResponse usernameResponse = new MockHttpServletResponse();
        MockFilterChain usernameChain = new MockFilterChain();

        filter.doFilter(usernameRequest, usernameResponse, usernameChain);

        assertThat(refreshResponse.getStatus()).isEqualTo(200);
        assertThat(refreshChain.getRequest()).isNotNull();
        assertThat(usernameResponse.getStatus()).isEqualTo(200);
        assertThat(usernameChain.getRequest()).isNotNull();
    }

    @Test
    void secondProtectedAuthRequestFromSameIpGetsRateLimited() throws Exception {
        MockHttpServletRequest firstRequest = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        firstRequest.setRemoteAddr("10.0.0.5");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();

        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());

        MockHttpServletRequest secondRequest = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        secondRequest.setRemoteAddr("10.0.0.5");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();

        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());

        assertThat(firstResponse.getStatus()).isEqualTo(200);
        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getContentAsString()).contains("Too many requests");
    }

    @Test
    void forwardedForHeaderUsesFirstIpAsBucketKey() throws Exception {
        MockHttpServletRequest firstRequest = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        firstRequest.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");
        firstRequest.setRemoteAddr("127.0.0.1");
        filter.doFilter(firstRequest, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletRequest secondRequest = new MockHttpServletRequest("POST", "/api/v1/auth/register");
        secondRequest.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.2");
        secondRequest.setRemoteAddr("127.0.0.2");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();

        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());

        MockHttpServletRequest otherIpRequest = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        otherIpRequest.addHeader("X-Forwarded-For", "203.0.113.11");
        MockHttpServletResponse otherIpResponse = new MockHttpServletResponse();
        MockFilterChain otherIpChain = new MockFilterChain();

        filter.doFilter(otherIpRequest, otherIpResponse, otherIpChain);

        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(otherIpResponse.getStatus()).isEqualTo(200);
        assertThat(otherIpChain.getRequest()).isNotNull();
    }
}
