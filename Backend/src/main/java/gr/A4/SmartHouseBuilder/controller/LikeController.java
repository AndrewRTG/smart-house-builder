package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.LikeService;
import lombok.RequiredArgsConstructor;
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
public class LikeController {
    private final LikeService likeService;

    @PostMapping("/setups/{setupId}/like")
    public ResponseEntity<Map<String, Object>> toggleSetupLike(
            @PathVariable Long setupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isLiked = likeService.toggleSetupLike(setupId, userDetails.getUsername());
        long count = likeService.getSetupLikeCount(setupId);

        Map<String, Object> response = new HashMap<>();
        response.put("isLiked", isLiked);
        response.put("likeCount", count);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/setups/{setupId}/like-count")
    public ResponseEntity<Map<String, Long>> getSetupLikeCount(@PathVariable Long setupId) {
        long count = likeService.getSetupLikeCount(setupId);
        Map<String, Long> response = new HashMap<>();
        response.put("likeCount", count);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/articles/{articleId}/like")
    public ResponseEntity<Map<String, Object>> toggleArticleLike(
            @PathVariable Long articleId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isLiked = likeService.toggleArticleLike(articleId, userDetails.getUsername());
        long count = likeService.getArticleLikeCount(articleId);

        Map<String, Object> response = new HashMap<>();
        response.put("isLiked", isLiked);
        response.put("likeCount", count);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/articles/{articleId}/like-count")
    public ResponseEntity<Map<String, Long>> getArticleLikeCount(@PathVariable Long articleId) {
        long count = likeService.getArticleLikeCount(articleId);
        Map<String, Long> response = new HashMap<>();
        response.put("likeCount", count);
        return ResponseEntity.ok(response);
    }
}
