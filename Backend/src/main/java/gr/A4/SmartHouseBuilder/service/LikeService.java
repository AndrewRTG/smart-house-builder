package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.Like;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LikeService {
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final SetupRepository setupRepository;
    private final ArticleRepository articleRepository;
    private final NotificationService notificationService;
    private final ActivityEmailService activityEmailService;

    @Transactional
    public boolean toggleSetupLike(Long setupId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Setup setup = setupRepository.findById(setupId)
                .orElseThrow(() -> new RuntimeException("Setup not found"));

        var existing = likeRepository.findByUserIdAndSetupId(user.getId(), setupId);

        if (existing.isPresent()) {
            likeRepository.deleteByUserIdAndSetupId(user.getId(), setupId);
            log.info("Setup like removed: {} by user: {}", setupId, email);
            return false;
        } else {
            Like like = Like.builder()
                    .user(user)
                    .setup(setup)
                    .build();
            likeRepository.save(like);
            log.info("Setup liked: {} by user: {}", setupId, email);

            String setupOwner = setup.getUser().getUsername();
            String userThatLiked = user.getUsername();

            if (!setupOwner.equals(userThatLiked)) {
                notificationService.triggerNotification(
                        setupOwner,
                        userThatLiked + " liked your setup!"
                );
                activityEmailService.onLike(setup.getUser(), userThatLiked, setup.getName(), "SETUP");
            }


            return true;
        }
    }

    @Transactional
    public boolean toggleArticleLike(Long articleId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        var existing = likeRepository.findByUserIdAndArticleId(user.getId(), articleId);

        if (existing.isPresent()) {
            likeRepository.deleteByUserIdAndArticleId(user.getId(), articleId);
            log.info("Article like removed: {} by user: {}", articleId, email);
            return false;
        } else {
            Like like = Like.builder()
                    .user(user)
                    .article(article)
                    .build();
            likeRepository.save(like);
            log.info("Article liked: {} by user: {}", articleId, email);

            String articleOwner = article.getUser().getUsername();
            String userThatLiked = user.getUsername();

            if (!articleOwner.equals(userThatLiked)) {
                notificationService.triggerNotification(
                        articleOwner,
                        userThatLiked + " liked your article!"
                );
                activityEmailService.onLike(article.getUser(), userThatLiked, article.getTitle(), "ARTICLE");
            }
            return true;
        }
    }

    public long getSetupLikeCount(Long setupId) {
        return likeRepository.countBySetupId(setupId);
    }

    public long getArticleLikeCount(Long articleId) {
        return likeRepository.countByArticleId(articleId);
    }

    public boolean isSetupLiked(Long setupId, String email) {
        Long userId = getUserId(email);
        return likeRepository.findByUserIdAndSetupId(userId, setupId).isPresent();
    }

    public boolean isArticleLiked(Long articleId, String email) {
        Long userId = getUserId(email);
        return likeRepository.findByUserIdAndArticleId(userId, articleId).isPresent();
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();
    }
}
