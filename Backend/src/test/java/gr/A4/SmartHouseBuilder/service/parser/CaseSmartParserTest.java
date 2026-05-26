package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class CaseSmartParserTest {

    private CaseSmartParser parser;

    @BeforeEach
    void setUp() {
        parser = new CaseSmartParser();
    }

    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        String xml = "<items><item>" +
                "<title>Priza Smart Wi-Fi</title>" +
                "<description>Priza inteligenta programabila.</description>" +
                "<price>55.0</price>" +
                "<image_urls>http://poza.ro/priza.jpg</image_urls>" +
                "<aff_code>http://link.ro</aff_code>" +
                "</item></items>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertEquals(1, result.size(), "Trebuie să importe exact un produs.");
        assertEquals("Generic", result.get(0).getBrand());
    }

    @Test
    void testParse_FilterJunkItems() {
        String xml = "<items><item>" +
                "<title>Cablu prelungitor 3m</title>" +
                "<description>Accesorii electrice clasice</description>" +
                "<price>15.5</price>" +
                "<aff_code>http://link.ro</aff_code>" +
                "</item></items>";
        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertTrue(result.isEmpty(), "Cablul trebuie filtrat. Lista trebuie să fie goală.");
    }

    @Test
    void testParse_EdgeCase_InvalidXml() {
        String xml = "<items><item><title>Priza fara pret si link</title></item></items>";
        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));

        List<DeviceImportDto> result = parser.parse(is);
        assertTrue(result.isEmpty(), "La XML invalid, trebuie să returneze listă goală fără să crape.");
    }
}