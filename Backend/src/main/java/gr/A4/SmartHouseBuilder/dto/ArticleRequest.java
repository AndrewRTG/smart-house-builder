package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleRequest {
    @NotBlank(message = "Article title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Article content is required")
    @Size(min = 10, message = "Content must be at least 10 characters")
    private String content;

    // Optional cover image URL. Empty string is allowed for "no image".
    // Must be http(s) when present so the frontend can render it via <img src=...>.
    @Pattern(regexp = "^(https?://.*|)$", message = "imageUrl must be a valid http(s) URL or empty")
    private String imageUrl;

    @NotNull(message = "Device list cannot be null")
    private List<Long> deviceIds;

    private List<String> tags;
}
