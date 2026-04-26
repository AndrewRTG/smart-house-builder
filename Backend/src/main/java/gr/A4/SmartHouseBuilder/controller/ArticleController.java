package gr.A4.SmartHouseBuilder.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.ArticleRequest;
import gr.A4.SmartHouseBuilder.dto.ArticleResponse;
import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ArticleController {
    private final ArticleService articleService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<ArticleResponse> createArticle(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ArticleRequest request) {
        Article article = articleService.createArticle(userDetails.getUsername(), request);
        return ResponseEntity.status(201).body(toResponse(article));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleResponse> getArticle(@PathVariable Long id) {
        Article article = articleService.getArticle(id);
        return ResponseEntity.ok(toResponse(article));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ArticleRequest request) {
        Article article = articleService.updateArticle(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(toResponse(article));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        articleService.deleteArticle(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ArticleResponse>> getAllArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Article> articles = articleService.getAllArticles(PageRequest.of(page, size));
        return ResponseEntity.ok(articles.map(this::toResponse));
    }

    @GetMapping("/user/my-articles")
    public ResponseEntity<List<ArticleResponse>> getUserArticles(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Article> articles = articleService.getUserArticles(userDetails.getUsername());
        return ResponseEntity.ok(articles.stream().map(this::toResponse).toList());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ArticleResponse>> searchArticles(
            @RequestParam String query) {

        List<Article> articles = articleService.searchArticles(query);

        return ResponseEntity.ok(articles.stream().map(this::toResponse).toList());
    }

    private ArticleResponse toResponse(Article article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .content(article.getContent())
                .authorUsername(article.getUser().getUsername())
                .authorId(article.getUser().getId())
                .deviceIds(deserializeDeviceIds(article.getDeviceIds()))
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    private List<Long> deserializeDeviceIds(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
