package gr.A4.SmartHouseBuilder.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MfaServiceTest {

    private final MfaService mfaService = new MfaService();

    @Test
    void generateSecret_returnsNonBlankSecret() {
        String secret = mfaService.generateSecret();

        assertThat(secret).isNotBlank();
    }

    @Test
    void generateQrCodeUri_containsIssuerLabelAndSecret() {
        String uri = mfaService.generateQrCodeUri("SECRET123", "user@example.com");

        assertThat(uri).contains("SmartHouseBuilder");
        assertThat(uri).contains("user");
        assertThat(uri).contains("SECRET123");
    }

    @Test
    void verifyCode_rejectsObviouslyInvalidCode() {
        assertThat(mfaService.verifyCode("SECRET123", "000000")).isFalse();
    }
}
