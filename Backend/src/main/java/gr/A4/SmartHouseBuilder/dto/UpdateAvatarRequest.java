package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar URL is required")
    @Size(max = 2048, message = "Avatar URL is too long")
    @Pattern(regexp = "^https?://.*", message = "Avatar URL must be a valid http(s) URL")
    private String avatarUrl;
}
