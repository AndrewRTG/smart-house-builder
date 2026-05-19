package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.Like;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    @Mock
    private LikeRepository likeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SetupRepository setupRepository;

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ActivityEmailService activityEmailService;

    @InjectMocks
    private LikeService likeService;

    @Test
    void toggleSetupLike_removesExistingLike() {
        User user = User.builder().id(1L).email("user@example.com").username("liker").build();
        Setup setup = Setup.builder().id(11L).name("Setup").user(User.builder().username("owner").build()).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(setupRepository.findById(11L)).thenReturn(Optional.of(setup));
        when(likeRepository.findByUserIdAndSetupId(1L, 11L)).thenReturn(Optional.of(new Like()));

        boolean result = likeService.toggleSetupLike(11L, "user@example.com");

        assertThat(result).isFalse();
        verify(likeRepository).deleteByUserIdAndSetupId(1L, 11L);
        verify(notificationService, never()).triggerNotification(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void toggleSetupLike_addsLikeAndNotifiesOwner() {
        User user = User.builder().id(1L).email("user@example.com").username("liker").build();
        User owner = User.builder().id(2L).username("owner").build();
        Setup setup = Setup.builder().id(11L).name("Setup").user(owner).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(setupRepository.findById(11L)).thenReturn(Optional.of(setup));
        when(likeRepository.findByUserIdAndSetupId(1L, 11L)).thenReturn(Optional.empty());

        boolean result = likeService.toggleSetupLike(11L, "user@example.com");

        assertThat(result).isTrue();
        ArgumentCaptor<Like> captor = ArgumentCaptor.forClass(Like.class);
        verify(likeRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getSetup()).isEqualTo(setup);
        verify(notificationService).triggerNotification("owner", "liker liked your setup!");
    }

    @Test
    void toggleSetupLike_doesNotNotifyWhenOwnerLikesOwnSetup() {
        User owner = User.builder().id(1L).email("owner@example.com").username("owner").build();
        Setup setup = Setup.builder().id(11L).name("Setup").user(owner).build();
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(setupRepository.findById(11L)).thenReturn(Optional.of(setup));
        when(likeRepository.findByUserIdAndSetupId(1L, 11L)).thenReturn(Optional.empty());

        boolean result = likeService.toggleSetupLike(11L, "owner@example.com");

        assertThat(result).isTrue();
        verify(notificationService, never()).triggerNotification(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void toggleArticleLike_removesExistingLike() {
        User user = User.builder().id(1L).email("user@example.com").username("liker").build();
        Article article = Article.builder().id(7L).title("Article").content("Body").user(User.builder().username("owner").build()).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(articleRepository.findById(7L)).thenReturn(Optional.of(article));
        when(likeRepository.findByUserIdAndArticleId(1L, 7L)).thenReturn(Optional.of(new Like()));

        boolean result = likeService.toggleArticleLike(7L, "user@example.com");

        assertThat(result).isFalse();
        verify(likeRepository).deleteByUserIdAndArticleId(1L, 7L);
        verify(notificationService, never()).triggerNotification(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void toggleArticleLike_addsLikeAndNotifiesOwner() {
        User user = User.builder().id(1L).email("user@example.com").username("liker").build();
        User owner = User.builder().id(2L).username("author").build();
        Article article = Article.builder().id(7L).title("Article").content("Body").user(owner).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(articleRepository.findById(7L)).thenReturn(Optional.of(article));
        when(likeRepository.findByUserIdAndArticleId(1L, 7L)).thenReturn(Optional.empty());

        boolean result = likeService.toggleArticleLike(7L, "user@example.com");

        assertThat(result).isTrue();
        ArgumentCaptor<Like> captor = ArgumentCaptor.forClass(Like.class);
        verify(likeRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getArticle()).isEqualTo(article);
        verify(notificationService).triggerNotification("author", "liker liked your article!");
    }

    @Test
    void toggleSetupLike_throwsWhenUserIsMissing() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.toggleSetupLike(4L, "missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void toggleArticleLike_throwsWhenArticleIsMissing() {
        User user = User.builder().id(1L).email("user@example.com").username("liker").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(articleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.toggleArticleLike(99L, "user@example.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Article not found");
    }

    @Test
    void countAndLikedChecks_delegateToRepositoryUsingResolvedUserId() {
        User user = User.builder().id(5L).email("user@example.com").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(likeRepository.countBySetupId(12L)).thenReturn(8L);
        when(likeRepository.countByArticleId(15L)).thenReturn(3L);
        when(likeRepository.findByUserIdAndSetupId(5L, 12L)).thenReturn(Optional.of(new Like()));
        when(likeRepository.findByUserIdAndArticleId(5L, 15L)).thenReturn(Optional.of(new Like()));

        assertThat(likeService.getSetupLikeCount(12L)).isEqualTo(8L);
        assertThat(likeService.getArticleLikeCount(15L)).isEqualTo(3L);
        assertThat(likeService.isSetupLiked(12L, "user@example.com")).isTrue();
        assertThat(likeService.isArticleLiked(15L, "user@example.com")).isTrue();
    }
}
