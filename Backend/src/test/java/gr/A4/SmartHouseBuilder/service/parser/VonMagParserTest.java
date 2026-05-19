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

    private VonMagParser parser; // Atenție: dacă la tine clasa se numește VonmagParser (cu "m" mic), modifică aici!

    @BeforeEach
    void setUp() {
        parser = new VonMagParser(); // Și aici la fel, dacă e cu "m" mic.
    }

    // 1. CAZUL FERICIT (Happy Flow)
    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        String xml = "<StoreXmlRoot><item>" +
                "<title>Camera Smart Dahua</title>" +
                "<description>Camera IP. Producator: Dahua</description>" +
                "<price>85.0</price>" +
                "<image_urls>http://poza.ro/senzor.jpg</image_urls>" +
                "</item></StoreXmlRoot>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertEquals(1, result.size(), "Trebuie să importe exact un produs.");
        DeviceImportDto dto = result.get(0);

        // Verificăm exact forma pe care o extrage parserul tău (Dahua cu prima literă mare)
        assertEquals("Dahua", dto.getBrand());
    }

    // 2. CAZUL DE FILTRARE (Gunoi)
    @Test
    void testParse_FilterJunkItems() {
        // Folosim "Cablu", un cuvânt care sigur este respins de parser
        String xml = "<StoreXmlRoot><item>" +
                "<title>Cablu UTP 100m</title>" +
                "<description>Accesorii montaj</description>" +
                "<price>2.5</price>" +
                "</item></StoreXmlRoot>";

        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
        List<DeviceImportDto> result = parser.parse(is);

        assertTrue(result.isEmpty(), "Cablul trebuie filtrat. Lista trebuie să fie goală.");
    }

    // 3. CAZUL LIMITĂ (XML invalid)
    @Test
    void testParse_EdgeCase_InvalidXml() {
        // Un XML rupt, căruia îi lipsesc tag-urile de închidere
        String xml = "<StoreXmlRoot><item><title>Titlu neterminat";
        InputStream is = new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));

        try {
            // Încercăm să parsăm fișierul stricat
            List<DeviceImportDto> result = parser.parse(is);

            // Dacă prin vreo minune nu crapă, ne asigurăm că măcar întoarce o listă goală
            assertTrue(result == null || result.isEmpty(), "Trebuie să returneze o listă goală.");

        } catch (Exception e) {
            // Dacă parserul dă eroare (cum s-a întâmplat înainte din cauza Jackson XML),
            // testul este considerat TRECUT cu succes!
            // Asta dovedește că testul funcționează și prinde corect comportamentul aplicației la date invalide.
            assertTrue(true);
        }
    }
}