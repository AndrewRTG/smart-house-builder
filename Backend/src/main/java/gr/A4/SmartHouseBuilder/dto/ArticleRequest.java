package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleRequest {
    @NotBlank(message = "Article title is required")
    private String title;

    @NotBlank(message = "Article content is required")
    private String content;

    @NotNull(message = "Device list cannot be null")
    private List<Long> deviceIds;
}
