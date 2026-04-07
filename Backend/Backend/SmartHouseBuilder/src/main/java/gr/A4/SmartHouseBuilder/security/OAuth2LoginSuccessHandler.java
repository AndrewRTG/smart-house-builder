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
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from provider");
            return;
        }
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            return userRepository.save(User.builder()
                    .email(email)
                    .username(oauth2User.getAttribute("name"))
                    .provider("google")
                    .providerId(oauth2User.getName())
                    .password(null)
                    .build());
        });

        String token = jwtUtil.generateToken(user.getEmail());
        System.out.println("Login succes! Token generat pentru: " + email);

        response.sendRedirect("http://localhost:5173/oauth2/callback?token=" + token);
    }
}