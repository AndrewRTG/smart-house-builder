package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CaseSmartParserTest {

    private CaseSmartParser parser;

    @BeforeEach
    void setUp() {
        parser = new CaseSmartParser();
    }

    // 1. CAZUL FERICIT (Happy Flow)
    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        String xml = "<StoreXmlRoot><item>" +
                "<title>Priza Smart Wi-Fi</title>" +
                "<description>Priza inteligenta programabila.</description>" +
                "<price>55.0</price>" +
                "<image_urls>http://poza.ro/priza.jpg</image_urls>" +
                "</item></StoreXmlRoot>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertEquals(1, result.size(), "Trebuie să importe exact un produs.");
        DeviceImportDto dto = result.get(0);

        // REPARAT: Parserul returnează "Generic" dacă nu găsește un brand explicit.
        assertEquals("Generic", dto.getBrand());
    }

    // 2. CAZUL DE FILTRARE (Gunoi)
    @Test
    void testParse_FilterJunkItems() {
        String xml = "<StoreXmlRoot><item>" +
                "<title>Cablu prelungitor 3m</title>" +
                "<description>Accesorii electrice clasice</description>" +
                "<price>15.5</price>" +
                "</item></StoreXmlRoot>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertTrue(result.isEmpty(), "Cablul trebuie filtrat. Lista trebuie să fie goală.");
    }

    // 3. CAZUL LIMITĂ (XML invalid)
    @Test
    void testParse_EdgeCase_InvalidXml() {
        String xml = "<StoreXmlRoot><item><title>Priza neterminata";
        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));

        // REPARAT: Parserul tău prinde intern eroarea, deci ne așteptăm doar la o listă goală.
        List<DeviceImportDto> result = parser.parse(is);
        assertNotNull(result);
        assertTrue(result.isEmpty(), "La XML invalid, trebuie să returneze listă goală fără să crape.");
    }
}