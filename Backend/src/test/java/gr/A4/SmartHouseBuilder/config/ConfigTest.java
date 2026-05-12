package gr.A4.SmartHouseBuilder.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import static org.assertj.core.api.Assertions.assertThatCode;

class ConfigTest {

    @Test
    void corsConfigurer_canRegisterMappings() {
        var configurer = new Config().corsConfigurer();

        assertThatCode(() -> configurer.addCorsMappings(new CorsRegistry()))
                .doesNotThrowAnyException();
    }
}
