package gr.A4.SmartHouseBuilder.config;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.Role;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DemoDataSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SetupRepository setupRepository;

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DemoDataSeeder demoDataSeeder;

    @Test
    void run_skipsWhenDataAlreadyExists() {
        when(setupRepository.count()).thenReturn(1L);
        when(articleRepository.count()).thenReturn(0L);

        demoDataSeeder.run();

        verify(userRepository, never()).findByEmail(any());
        verify(setupRepository, never()).saveAll(any());
        verify(articleRepository, never()).saveAll(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void run_createsDemoUserAndSeedsPublishedContent() {
        when(setupRepository.count()).thenReturn(0L);
        when(articleRepository.count()).thenReturn(0L);
        when(userRepository.findByEmail("demo@smarthouse.local")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("DemoPass123!")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        demoDataSeeder.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("demo@smarthouse.local");
        assertThat(savedUser.getUsername()).isEqualTo("smarthouse_demo");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-password");
        assertThat(savedUser.getRole()).isEqualTo(Role.USER);
        assertThat(savedUser.isVerified()).isTrue();
        assertThat(savedUser.isMfaEnabled()).isFalse();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Setup>> setupsCaptor = ArgumentCaptor.forClass((Class) List.class);
        verify(setupRepository).saveAll(setupsCaptor.capture());
        List<Setup> setups = setupsCaptor.getValue();
        assertThat(setups).hasSize(5);
        assertThat(setups).allSatisfy(setup -> {
            assertThat(setup.getUser()).isEqualTo(savedUser);
            assertThat(setup.isPublicSetup()).isTrue();
            assertThat(setup.getStatus()).isEqualTo(SetupStatus.PUBLISHED);
            assertThat(setup.getName()).isNotBlank();
            assertThat(setup.getDeviceIds()).isNotBlank();
        });

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Article>> articlesCaptor = ArgumentCaptor.forClass((Class) List.class);
        verify(articleRepository).saveAll(articlesCaptor.capture());
        List<Article> articles = articlesCaptor.getValue();
        assertThat(articles).hasSize(4);
        assertThat(articles).allSatisfy(article -> {
            assertThat(article.getUser()).isEqualTo(savedUser);
            assertThat(article.getTitle()).isNotBlank();
            assertThat(article.getContent()).isNotBlank();
            assertThat(article.getDeviceIds()).isNotBlank();
        });
    }

    @Test
    void run_reusesExistingDemoUserWithoutCreatingAnotherOne() {
        User existingDemo = User.builder()
                .id(7L)
                .email("demo@smarthouse.local")
                .username("smarthouse_demo")
                .build();
        when(setupRepository.count()).thenReturn(0L);
        when(articleRepository.count()).thenReturn(0L);
        when(userRepository.findByEmail("demo@smarthouse.local")).thenReturn(Optional.of(existingDemo));

        demoDataSeeder.run();

        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(any());
        verify(setupRepository).saveAll(any());
        verify(articleRepository).saveAll(any());
    }
}
