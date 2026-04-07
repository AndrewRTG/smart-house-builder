package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Username or email is required.")
    @Size(max = 255, message = "Identifier must not exceed 255 characters.")
    private String identifier;

    @NotBlank(message = "Password is required.")
    @Size(max = 128, message = "Password must not exceed 128 characters.")
    private String password;
}
