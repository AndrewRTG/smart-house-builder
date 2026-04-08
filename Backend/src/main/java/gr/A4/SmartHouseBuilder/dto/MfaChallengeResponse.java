package gr.A4.SmartHouseBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaChallengeResponse {

    private boolean mfaRequired;
    private String mfaToken;
}
