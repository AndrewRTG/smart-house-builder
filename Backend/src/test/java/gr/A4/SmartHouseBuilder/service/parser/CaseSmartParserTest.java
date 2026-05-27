package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CaseSmartParserTest {

    private CaseSmartParser parser;

    @BeforeEach
    void setUp() {
        parser = new CaseSmartParser();
    }

    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Priza Smart Wi-Fi", "Priza inteligenta programabila.", 55.0, "http://poza.ro/priza.jpg")
        ));

        assertEquals(1, result.size());
        assertEquals("Generic", result.get(0).getBrand());
    }

    @Test
    void testParse_FilterJunkItems() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Cablu prelungitor 3m", "Accesorii electrice clasice", 15.5, "")
        ));

        assertTrue(result.isEmpty());
    }

    @Test
    void testParse_EdgeCase_InvalidXml() {
        List<DeviceImportDto> result = parser.parse(stream("<items><item><title>Priza fara pret si link</title></item></items>"));
        assertTrue(result.isEmpty());
    }

    @Test
    void parsesCaseSmartSpecificCategoriesAndMapperFallbacks() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Camera de supraveghere Ezviz", "camera ip smart", 220.0, "https://img/camera.jpg"),
                item("Purificator de aer smart Levoit", "wi-fi aplicatie", 700.0, "https://img/purificator.jpg"),
                item("Broadlink hub RM4", "gateway smart home", 230.0, "https://img/hub.jpg"),
                item("Bec led smart Philips Hue", "zigbee google home", 130.0, "https://img/bec.jpg"),
                item("Intrerupator smart Livolo touch", "rf433 control aplicatie", 95.0, "https://img/switch.jpg"),
                item("Priza inteligenta Gosund", "monitorizare consum wi-fi", 70.0, "https://img/plug.jpg"),
                item("Aspirator robot Xiaomi", "robot vacuum smart", 1200.0, "https://img/robot.jpg")
        ));

        Map<String, Integer> categories = result.stream()
                .collect(Collectors.toMap(DeviceImportDto::getName, DeviceImportDto::getCategoryId));

        assertEquals(7, result.size());
        assertEquals(1, categories.get("Camera de supraveghere Ezviz"));
        assertEquals(4, categories.get("Purificator de aer smart Levoit"));
        assertEquals(5, categories.get("Broadlink hub RM4"));
        assertEquals(13, categories.get("Bec led smart Philips Hue"));
        assertEquals(7, categories.get("Intrerupator smart Livolo touch"));
        assertEquals(7, categories.get("Priza inteligenta Gosund"));
        assertEquals(11, categories.get("Aspirator robot Xiaomi"));
    }

    @Test
    void extractsBrandProtocolsImagesAndSpecifications() {
        List<DeviceImportDto> result = parser.parse(xml(
                "<item>" +
                        "<title><![CDATA[Priza smart &amp; consum]]></title>" +
                        "<description><![CDATA[BRAND : TP-LINK<br/>Protocol Matter si Wi-Fi]]></description>" +
                        "<price>120</price>" +
                        "<image_urls> https://img/first.jpg , https://img/second.jpg </image_urls>" +
                        "<aff_code> https://shop/priza </aff_code>" +
                        "</item>",
                item("Intrerupator smart Aqara", "z-wave wireless touch", 144.0, ""),
                item("Buton sonerie smart", "868mhz atingere", 50.0, "https://img/button.jpg")
        ));

        DeviceImportDto first = result.stream()
                .filter(dto -> dto.getName().contains("consum"))
                .findFirst()
                .orElseThrow();

        assertEquals("TP-Link", first.getBrand());
        assertEquals("Matter", first.getCommunicationProtocol());
        assertEquals("https://img/first.jpg", first.getImageUrl());
        assertEquals("https://shop/priza", first.getProductUrl());

        assertTrue(result.stream().anyMatch(dto -> "Z-Wave".equals(dto.getCommunicationProtocol())));
        assertTrue(result.stream().anyMatch(dto -> "RF 868MHz".equals(dto.getCommunicationProtocol())));
    }

    @Test
    void filtersInvalidAccessoriesAndMalformedFeeds() {
        List<DeviceImportDto> result = parser.parse(xml(
                "<item><description>missing title</description><price>10</price><aff_code>https://shop/no-title</aff_code></item>",
                "<item><title>Priza smart fara pret</title><description>wifi</description><aff_code>https://shop/no-price</aff_code></item>",
                "<item><title>Priza smart fara link</title><description>wifi</description><price>99</price></item>",
                item("Releu simplu", "componenta electrica", 30.0, "https://img/releu.jpg"),
                item("Intrerupator mecanic", "clasic", 40.0, "https://img/mecanic.jpg"),
                item("Filtru de rezerva pentru purificator", "consumabil", 90.0, "https://img/filter.jpg"),
                item("Priza dubla internet", "cat6", 25.0, "https://img/net.jpg"),
                item("Banda led simpla", "iluminat clasic", 45.0, "https://img/led.jpg")
        ));

        assertTrue(result.isEmpty());
        assertTrue(parser.parse(stream("<items><item>")).isEmpty());
        assertTrue(parser.parse(stream("<items/>")).isEmpty());
    }

    @Test
    void returnsNullProtocolWhenNoKnownProtocolIsPresent() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Camera smart Generic", "control aplicatie", 99.0, "https://img/camera.jpg")
        ));

        assertEquals(1, result.size());
        assertNull(result.get(0).getCommunicationProtocol());
    }

    private static InputStream xml(String... items) {
        return stream("<items>" + String.join("", items) + "</items>");
    }

    private static String item(String title, String description, double price, String imageUrl) {
        return "<item>" +
                "<title>" + title + "</title>" +
                "<description>" + description + "</description>" +
                "<price>" + price + "</price>" +
                "<image_urls>" + imageUrl + "</image_urls>" +
                "<aff_code>https://shop/" + title.replace(" ", "-") + "</aff_code>" +
                "</item>";
    }

    private static InputStream stream(String xml) {
        return new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8));
    }
}
