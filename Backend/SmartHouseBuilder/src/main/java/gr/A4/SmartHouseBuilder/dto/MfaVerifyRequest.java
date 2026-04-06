package gr.A4.SmartHouseBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaVerifyRequest {

    @NotBlank
    private String mfaToken;

    @NotBlank
    private String code;
}
