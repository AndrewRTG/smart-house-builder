package gr.A4.SmartHouseBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleResponse {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private String authorUsername;
    private Long authorId;
    private String authorAvatarUrl;
    private List<Long> deviceIds;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @lombok.Builder.Default private Long likeCount = 0L;
    @lombok.Builder.Default private Long commentCount = 0L;
    /** Lifecycle stage. "DRAFT" or "PUBLISHED" — kept as a String so the
     *  frontend doesn't need to mirror the Java enum class. */
    private String status;
}