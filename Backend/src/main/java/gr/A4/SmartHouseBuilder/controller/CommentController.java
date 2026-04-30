package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.CommentRequest;
import gr.A4.SmartHouseBuilder.dto.CommentResponse;
import gr.A4.SmartHouseBuilder.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CommentController {
    private final CommentService commentService;

    @PostMapping("/setups/{setupId}/comments")
    public ResponseEntity<CommentResponse> createSetupComment(
            @PathVariable Long setupId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = commentService.createSetupComment(setupId, userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/setups/{setupId}/comments")
    public ResponseEntity<Page<CommentResponse>> getSetupComments(
            @PathVariable Long setupId,
            Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        Page<CommentResponse> comments = commentService.getSetupComments(setupId, pageable, email);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/articles/{articleId}/comments")
    public ResponseEntity<CommentResponse> createArticleComment(
            @PathVariable Long articleId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = commentService.createArticleComment(articleId, userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/articles/{articleId}/comments")
    public ResponseEntity<Page<CommentResponse>> getArticleComments(
            @PathVariable Long articleId,
            Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        Page<CommentResponse> comments = commentService.getArticleComments(articleId, pageable, email);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(commentId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/setups/{setupId}/comment-count")
    public ResponseEntity<Map<String, Long>> getSetupCommentCount(@PathVariable Long setupId) {
        long count = commentService.getSetupCommentCount(setupId);
        Map<String, Long> response = new HashMap<>();
        response.put("commentCount", count);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/articles/{articleId}/comment-count")
    public ResponseEntity<Map<String, Long>> getArticleCommentCount(@PathVariable Long articleId) {
        long count = commentService.getArticleCommentCount(articleId);
        Map<String, Long> response = new HashMap<>();
        response.put("commentCount", count);
        return ResponseEntity.ok(response);
    }
}
