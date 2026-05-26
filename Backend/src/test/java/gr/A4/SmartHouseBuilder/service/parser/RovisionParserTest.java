package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RovisionParserTest {

    private RovisionParser parser;

    @BeforeEach
    void setUp() {
        parser = new RovisionParser();
    }

    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        String xml = "<items><item>" +
                "<title>Camera Smart IP HIKVISION</title>" +
                "<description>Camera supraveghere IP. Producator: HIKVISION</description>" +
                "<price>150.5</price>" +
                "<image_urls>http://poza.ro/1.jpg</image_urls>" +
                "<aff_code>http://link.ro</aff_code>" +
                "</item></items>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertEquals(1, result.size(), "Trebuie să importe exact un produs.");
        DeviceImportDto dto = result.get(0);
        assertEquals(150.5, dto.getPrice());
        assertEquals("HIKVISION", dto.getBrand());
        assertEquals("ROVISION", dto.getSourceStore());
        assertEquals(1, dto.getCategoryId());
    }

    @Test
    void testParse_FilterJunkItems() {
        String xml = "<items><item>" +
                "<title>Cablu UTP 100m</title>" +
                "<description>Cablu retea cupru masiv</description>" +
                "<price>120.0</price>" +
                "<aff_code>http://link.ro</aff_code>" +
                "</item></items>";
        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertTrue(result.isEmpty(), "Cablul trebuie filtrat.");
    }
}
