package gr.A4.SmartHouseBuilder.dto;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DeviceImportDtoTest {

    @Test
    void storesImportedDeviceFields() {
        DeviceImportDto dto = new DeviceImportDto();

        dto.setName("Smart Plug");
        dto.setPrice(79.99);
        dto.setBrand("Shelly");
        dto.setDescription("Wi-Fi plug");
        dto.setImageUrl("https://example.test/plug.png");
        dto.setSourceStore("ROVISION");
        dto.setCategoryId(3);

        assertThat(dto.getName()).isEqualTo("Smart Plug");
        assertThat(dto.getPrice()).isEqualTo(79.99);
        assertThat(dto.getBrand()).isEqualTo("Shelly");
        assertThat(dto.getDescription()).isEqualTo("Wi-Fi plug");
        assertThat(dto.getImageUrl()).isEqualTo("https://example.test/plug.png");
        assertThat(dto.getSourceStore()).isEqualTo("ROVISION");
        assertThat(dto.getCategoryId()).isEqualTo(3);
    }
}
