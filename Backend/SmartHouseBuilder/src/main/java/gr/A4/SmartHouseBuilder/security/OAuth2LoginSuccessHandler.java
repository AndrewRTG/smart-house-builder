package gr.A4.SmartHouseBuilder.security;

import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String provider = authentication.getAuthorities().toString().contains("google") ? "google" : "facebook";
        String providerId = oauth2User.getAttribute("sub") != null
                ? oauth2User.getAttribute("sub")
                : oauth2User.getAttribute("id");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .username(name)
                    .provider(provider)
                    .providerId(providerId)
                    .build();
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(user.getEmail());
        response.sendRedirect("http://localhost:3000/oauth2/callback?token=" + token);
    }
}