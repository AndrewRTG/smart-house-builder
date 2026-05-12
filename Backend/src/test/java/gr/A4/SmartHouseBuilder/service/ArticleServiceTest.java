package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.ArticleRequest;
import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArticleServiceTest {

    @Mock private ArticleRepository articleRepository;
    @Mock private UserRepository userRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @Mock private CommentService commentService;
    @Mock private LikeRepository likeRepository;
    @Mock private S3Service s3Service;

    @InjectMocks private ArticleService articleService;

    private ArticleRequest request(String title, String content, String imageUrl, List<Long> deviceIds, List<String> tags) {
        ArticleRequest req = new ArticleRequest();
        req.setTitle(title);
        req.setContent(content);
        req.setImageUrl(imageUrl);
        req.setDeviceIds(deviceIds);
        req.setTags(tags);
        return req;
    }

    @Test
    void createArticle_savesAndReturnsArticle() {
        User user = User.builder().id(1L).email("u@e").username("u").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> {
            Article a = inv.getArgument(0);
            a.setId(42L);
            return a;
        });

        ArticleRequest req = request("Title", "Body text content", "https://s3/img.jpg", List.of(1L, 2L), List.of("zigbee"));
        Article saved = articleService.createArticle("u@e", req);

        assertThat(saved.getId()).isEqualTo(42L);
        assertThat(saved.getTitle()).isEqualTo("Title");
        assertThat(saved.getImageUrl()).isEqualTo("https://s3/img.jpg");
        assertThat(saved.getDeviceIds()).isEqualTo("[1,2]");
        assertThat(saved.getTags()).isEqualTo("[\"zigbee\"]");
    }

    @Test
    void createArticle_treatsBlankImageUrlAsNull() {
        User user = User.builder().id(1L).email("u@e").username("u").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleRequest req = request("Title", "Body", "   ", List.of(), null);
        Article saved = articleService.createArticle("u@e", req);

        assertThat(saved.getImageUrl()).isNull();
        assertThat(saved.getTags()).isNull();
    }

    @Test
    void createArticle_throwsWhenUserMissing() {
        when(userRepository.findByEmail("missing@e")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> articleService.createArticle("missing@e", request("T", "Body", null, List.of(), null)))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void getArticle_returnsArticleWhenPresent() {
        Article article = Article.builder().id(7L).title("T").content("C").build();
        when(articleRepository.findById(7L)).thenReturn(Optional.of(article));

        assertThat(articleService.getArticle(7L)).isEqualTo(article);
    }

    @Test
    void getArticle_throwsWhenMissing() {
        when(articleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> articleService.getArticle(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Article not found");
    }

    @Test
    void updateArticle_replacesFieldsAndDeletesOldImage() {
        User user = User.builder().id(1L).email("u@e").username("u").build();
        Article existing = Article.builder().id(7L).user(user).title("Old").content("Old").imageUrl("https://s3/old.jpg").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(existing));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        ArticleRequest req = request("New", "New body content", "https://s3/new.jpg", List.of(3L), List.of("matter"));
        Article updated = articleService.updateArticle(7L, "u@e", req);

        verify(s3Service).deleteByUrl("https://s3/old.jpg");
        assertThat(updated.getTitle()).isEqualTo("New");
        assertThat(updated.getImageUrl()).isEqualTo("https://s3/new.jpg");
    }

    @Test
    void updateArticle_skipsS3DeleteWhenImageUnchanged() {
        User user = User.builder().id(1L).email("u@e").build();
        Article existing = Article.builder().id(7L).user(user).imageUrl("https://s3/same.jpg").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(existing));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        articleService.updateArticle(7L, "u@e", request("T", "Body", "https://s3/same.jpg", List.of(), null));

        verify(s3Service, never()).deleteByUrl(any());
    }

    @Test
    void updateArticle_throwsWhenArticleNotOwned() {
        User user = User.builder().id(1L).email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> articleService.updateArticle(7L, "u@e", request("T", "Body", null, List.of(), null)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not owned");
    }

    @Test
    void deleteArticle_clearsCommentsLikesAndRemovesImage() {
        User user = User.builder().id(1L).email("u@e").build();
        Article article = Article.builder().id(7L).user(user).imageUrl("https://s3/cover.jpg").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(article));

        articleService.deleteArticle(7L, "u@e");

        verify(s3Service).deleteByUrl("https://s3/cover.jpg");
        verify(commentService).deleteCommentTreeForArticle(7L);
        verify(likeRepository).deleteAllByArticleId(7L);
        verify(articleRepository).delete(article);
    }

    @Test
    void deleteArticle_throwsWhenNotOwned() {
        User user = User.builder().id(1L).email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> articleService.deleteArticle(7L, "u@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not owned");
        verify(articleRepository, never()).delete(any());
    }

    @Test
    void getUserArticles_delegatesToRepository() {
        User user = User.builder().id(1L).email("u@e").build();
        Article a = Article.builder().id(7L).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findByUserId(1L)).thenReturn(List.of(a));

        assertThat(articleService.getUserArticles("u@e")).containsExactly(a);
    }

    @Test
    void getAllArticles_returnsPaginatedResult() {
        Pageable pageable = PageRequest.of(0, 10);
        Article a = Article.builder().id(7L).build();
        Page<Article> page = new PageImpl<>(List.of(a), pageable, 1);
        when(articleRepository.findAll(pageable)).thenReturn(page);

        Page<Article> result = articleService.getAllArticles(pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).containsExactly(a);
    }
}
