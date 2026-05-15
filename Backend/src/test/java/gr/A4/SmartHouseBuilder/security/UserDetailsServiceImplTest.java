package gr.A4.SmartHouseBuilder.security;

import gr.A4.SmartHouseBuilder.entity.Role;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void loadUserByUsername_looksUpEmailWhenIdentifierContainsAtSign() {
        User user = User.builder()
                .email("user@example.com")
                .username("user1")
                .password("secret")
                .role(Role.ADMIN)
                .build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        var result = userDetailsService.loadUserByUsername("user@example.com");

        assertThat(result.getUsername()).isEqualTo("user@example.com");
        assertThat(result.getPassword()).isEqualTo("secret");
        assertThat(result.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
    }

    @Test
    void loadUserByUsername_looksUpUsernameWhenIdentifierHasNoAtSign() {
        User user = User.builder()
                .email("john@example.com")
                .username("johnny")
                .password(null)
                .role(Role.USER)
                .build();
        when(userRepository.findByUsername("johnny")).thenReturn(Optional.of(user));

        var result = userDetailsService.loadUserByUsername("johnny");

        assertThat(result.getUsername()).isEqualTo("john@example.com");
        assertThat(result.getPassword()).isEmpty();
        assertThat(result.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
    }

    @Test
    void loadUserByUsername_throwsWhenEmailNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("missing@example.com");
    }
}
