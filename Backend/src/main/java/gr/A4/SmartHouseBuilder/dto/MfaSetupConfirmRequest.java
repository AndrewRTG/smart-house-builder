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
public class MfaSetupConfirmRequest {

    @NotBlank(message = "MFA code is required.")
    @Size(min = 6, max = 6, message = "MFA code must be exactly 6 digits.")
    @Pattern(regexp = "^[0-9]{6}$", message = "MFA code must be a 6-digit number.")
    private String code;
}