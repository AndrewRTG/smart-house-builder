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
    private String authorUsername;
    private Long authorId;
    private List<Long> deviceIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
