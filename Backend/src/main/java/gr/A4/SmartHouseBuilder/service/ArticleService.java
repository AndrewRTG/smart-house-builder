package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.ArticleRequest;
import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleService {
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final CommentService commentService;
    private final LikeRepository likeRepository;
    // ── S3 ──────────────────────────────────────────────────────────────────
    private final S3Service s3Service;

    @Transactional
    public Article createArticle(String email, ArticleRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Article article = Article.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrl(emptyToNull(request.getImageUrl()))
                .deviceIds(serializeDeviceIds(request.getDeviceIds()))
                .tags(serializeTags(request.getTags()))
                .build();

        Article saved = articleRepository.save(article);
        log.info("Article created: {} by user: {}", saved.getId(), email);
        return saved;
    }

    public Article getArticle(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
    }

    @Transactional
    public Article updateArticle(Long id, String email, ArticleRequest request) {
        Long userId = getUserId(email);
        Article article = articleRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Article not found or not owned by you"));

        // If the cover image was replaced, remove the old one from S3.
        String oldImage = article.getImageUrl();
        String newImage = emptyToNull(request.getImageUrl());
        if (oldImage != null && !oldImage.equals(newImage)) {
            s3Service.deleteByUrl(oldImage);
        }

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setImageUrl(newImage);
        article.setDeviceIds(serializeDeviceIds(request.getDeviceIds()));
        article.setTags(serializeTags(request.getTags()));

        Article updated = articleRepository.save(article);
        log.info("Article updated: {} by user: {}", id, email);
        return updated;
    }

    @Transactional
    public void deleteArticle(Long id, String email) {
        Long userId = getUserId(email);
        Article article = articleRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Article not found or not owned by you"));

        // Remove the cover image from S3 before deleting the DB row.
        s3Service.deleteByUrl(article.getImageUrl());

        commentService.deleteCommentTreeForArticle(id);
        likeRepository.deleteAllByArticleId(id);
        articleRepository.delete(article);
        log.info("Article deleted: {} by user: {}", id, email);
    }

    public List<Article> getUserArticles(String email) {
        Long userId = getUserId(email);
        return articleRepository.findByUserId(userId);
    }

    public Page<Article> getAllArticles(Pageable pageable) {
        return articleRepository.findAll(pageable);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private String serializeDeviceIds(List<Long> deviceIds) {
        try {
            return objectMapper.writeValueAsString(deviceIds);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize device IDs", e);
        }
    }

    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize tags", e);
        }
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();
    }
}
