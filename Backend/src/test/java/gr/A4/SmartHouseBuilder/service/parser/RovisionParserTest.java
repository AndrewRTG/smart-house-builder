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
        // Inițializăm parserul proaspăt înainte de fiecare test
        parser = new RovisionParser();
    }

    // 1. CAZUL FERICIT (Happy Flow) - Un produs Smart corect
    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        // AM SCOS <items>. Lăsăm doar <StoreXmlRoot> și <item>
        String xml = "<StoreXmlRoot><item>" +
                "<title>Camera Smart HIKVISION 4MP</title>" +
                "<description>Camera supraveghere IP. Producator: HIKVISION</description>" +
                "<price>150.5</price>" +
                "<image_urls>http://poza.ro/1.jpg</image_urls>" +
                "</item></StoreXmlRoot>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertEquals(1, result.size(), "Trebuie să importe exact un produs.");
        DeviceImportDto dto = result.get(0);
        assertEquals("Camera Smart HIKVISION 4MP", dto.getName());
        assertEquals(150.5, dto.getPrice());
        assertEquals("HIKVISION", dto.getBrand(), "Trebuie să extragă corect brandul din descriere/titlu.");
        assertEquals("ROVISION", dto.getSourceStore());
        assertEquals(1, dto.getCategoryId(), "Camerele trebuie să meargă la categoria 1.");
    }

    // 2. CAZUL DE EROARE / LIMITĂ (Error Flow) - Filtrarea Gunoiului
    @Test
    void testParse_FilterJunkItems() {
        // AM SCOS <items>
        String xml = "<StoreXmlRoot><item>" +
                "<title>Cablu UTP 100m</title>" +
                "<description>Cablu retea cupru masiv</description>" +
                "<price>120.0</price>" +
                "</item></StoreXmlRoot>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertTrue(result.isEmpty(), "Cablul trebuie filtrat. Lista trebuie să fie goală.");
    }

    // 3. CAZUL LIMITĂ (Edge Case) - XML invalid sau incomplet
    @Test
    void testParse_EdgeCase_InvalidXml() {
        // Un XML complet stricat
        String xml = "<StoreXmlRoot><item><title>Doar un titlu rupt";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        // Aplicația NU trebuie să crape, ci să prindă excepția și să returneze o listă goală
        assertNotNull(result);
        assertTrue(result.isEmpty(), "La XML invalid, trebuie să returneze listă goală fără să arunce excepție.");
    }
}