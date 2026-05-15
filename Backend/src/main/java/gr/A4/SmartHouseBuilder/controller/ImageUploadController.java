package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Handles image uploads to AWS S3.
 *
 * POST /api/v1/images/articles  → returns { "url": "https://..." }
 * POST /api/v1/images/avatars   → returns { "url": "https://..." }
 *
 * The caller (frontend) stores the returned URL in the ArticleRequest.imageUrl
 * or calls PUT /api/v1/users/avatar with it. The backend never stores the raw
 * bytes — only the public S3 URL.
 */
@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ImageUploadController {

    private final S3Service s3Service;

    @PostMapping("/articles")
    public ResponseEntity<Map<String, String>> uploadArticleImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        String url = s3Service.upload(file, "articles");
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/avatars")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        String url = s3Service.upload(file, "avatars");
        return ResponseEntity.ok(Map.of("url", url));
    }
}
