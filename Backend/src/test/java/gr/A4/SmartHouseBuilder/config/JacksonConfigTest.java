package gr.A4.SmartHouseBuilder.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class JacksonConfigTest {

    @Test
    void objectMapper_registersJavaTimeModule() throws Exception {
        ObjectMapper mapper = new JacksonConfig().objectMapper();

        String json = mapper.writeValueAsString(LocalDateTime.of(2026, 1, 2, 3, 4, 5));

        assertThat(json).isNotBlank();
        assertThat(mapper.getRegisteredModuleIds()).isNotEmpty();
    }
}
