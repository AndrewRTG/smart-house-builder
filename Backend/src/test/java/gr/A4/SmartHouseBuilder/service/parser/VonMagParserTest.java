package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VonMagParserTest {

    private VonMagParser parser;

    @BeforeEach
    void setUp() {
        parser = new VonMagParser();
    }

    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        String xml = "<items><item>" +
                "<title>Camera Smart Dahua</title>" +
                "<description>Camera IP wi-fi. Producator: Dahua</description>" +
                "<price>85.0</price>" +
                "<image_urls>http://poza.ro/senzor.jpg</image_urls>" +
                "<aff_code>http://link.ro</aff_code>" +
                "</item></items>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertEquals(1, result.size(), "Trebuie să importe exact un produs.");
        assertEquals("Dahua", result.get(0).getBrand());
    }

    @Test
    void testParse_FilterJunkItems() {
        String xml = "<items><item>" +
                "<title>Cablu UTP 100m</title>" +
                "<description>Accesorii montaj</description>" +
                "<price>2.5</price>" +
                "<aff_code>http://link.ro</aff_code>" +
                "</item></items>";
        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertTrue(result.isEmpty(), "Cablul trebuie filtrat. Lista trebuie să fie goală.");
    }
}