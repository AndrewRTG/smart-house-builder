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

class RovisionParserTest {

    private RovisionParser parser;

    @BeforeEach
    void setUp() {
        parser = new RovisionParser();
    }

    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Camera Smart IP HIKVISION", "Camera supraveghere IP. Producator: HIKVISION", 150.5, "http://poza.ro/1.jpg")
        ));

        assertEquals(1, result.size());
        DeviceImportDto dto = result.get(0);
        assertEquals(150.5, dto.getPrice());
        assertEquals("HIKVISION", dto.getBrand());
        assertEquals("ROVISION", dto.getSourceStore());
        assertEquals(1, dto.getCategoryId());
    }

    @Test
    void testParse_FilterJunkItems() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Cablu UTP 100m", "Cablu retea cupru masiv", 120.0, "")
        ));

        assertTrue(result.isEmpty());
    }

    @Test
    void parsesStrongSignalsCorrectionsAndLighting() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Bec led smart Philips Hue", "zigbee alexa", 130.0, "https://img/bec.jpg"),
                item("Detector camera de supraveghere dome Dahua HAC-T3A21", "poe onvif", 220.0, "https://img/dome.jpg"),
                item("Detector kit sistem de alarma wireless Dahua ART-ARC3800H", "868mhz smart home", 450.0, "https://img/alarm.jpg"),
                item("Detector pir wireless Hikvision", "tri-x wireless 868mhz", 90.0, "https://img/detector.jpg"),
                item("Monitor videointerfon IP", "tcp/ip monitor de interior", 610.0, "https://img/interfon.jpg"),
                item("Router wireless TP-LINK", "wifi mesh", 320.0, "https://img/router.jpg"),
                item("Priza smart Shelly Plug", "wi-fi monitorizare consum", 99.0, "https://img/plug.jpg"),
                item("Soundbar smart Xiaomi", "sistem audio bluetooth", 700.0, "https://img/soundbar.jpg")
        ));

        Map<String, Integer> categories = result.stream()
                .collect(Collectors.toMap(DeviceImportDto::getName, DeviceImportDto::getCategoryId));

        assertEquals(8, result.size());
        assertEquals(13, categories.get("Bec led smart Philips Hue"));
        assertEquals(1, categories.get("Detector camera de supraveghere dome Dahua HAC-T3A21"));
        assertEquals(5, categories.get("Detector kit sistem de alarma wireless Dahua ART-ARC3800H"));
        assertEquals(8, categories.get("Detector pir wireless Hikvision"));
        assertEquals(6, categories.get("Monitor videointerfon IP"));
        assertEquals(12, categories.get("Router wireless TP-LINK"));
        assertEquals(7, categories.get("Priza smart Shelly Plug"));
        assertEquals(9, categories.get("Soundbar smart Xiaomi"));
    }

    @Test
    void extractsBrandProtocolImageAndHandlesGenericFallbacks() {
        List<DeviceImportDto> result = parser.parse(xml(
                "<item>" +
                        "<title>Camera IP UNIVIEW</title>" +
                        "<description>MODEL / PRODUCATOR: UNIVIEW, poe tcp/ip onvif</description>" +
                        "<price>300</price>" +
                        "<image_urls> https://img/one.jpg , https://img/two.jpg </image_urls>" +
                        "<aff_code> https://shop/camera </aff_code>" +
                        "</item>",
                item("Detector wireless necunoscut", "power g 868 mhz", 80.0, ""),
                item("Camera IP fara brand", "rtsp ethernet", 99.0, "https://img/generic.jpg")
        ));

        DeviceImportDto camera = result.stream()
                .filter(dto -> dto.getName().contains("UNIVIEW"))
                .findFirst()
                .orElseThrow();

        assertEquals("UNV", camera.getBrand());
        assertEquals("IP", camera.getCommunicationProtocol());
        assertEquals("https://img/one.jpg", camera.getImageUrl());
        assertEquals("https://shop/camera", camera.getProductUrl());

        assertTrue(result.stream().anyMatch(dto -> "RF 868MHz".equals(dto.getCommunicationProtocol())));
        assertTrue(result.stream().anyMatch(dto -> "Generic".equals(dto.getBrand())));
    }

    @Test
    void filtersInvalidWeakKnownWrongAndMalformedFeeds() {
        List<DeviceImportDto> result = parser.parse(xml(
                "<item><description>missing title</description><price>10</price><aff_code>https://shop/no-title</aff_code></item>",
                "<item><title>Camera IP fara pret</title><description>poe</description><aff_code>https://shop/no-price</aff_code></item>",
                "<item><title>Camera IP fara link</title><description>poe</description><price>99</price></item>",
                item("Suport camera metalic", "accesoriu montaj", 20.0, "https://img/suport.jpg"),
                item("Proiector led V-TAC", "iluminat exterior", 120.0, "https://img/proiector.jpg"),
                item("Decoratiune smart de birou", "fara categorie relevanta", 40.0, "https://img/decor.jpg")
        ));

        assertTrue(result.isEmpty());
        assertTrue(parser.parse(stream("<items><item>")).isEmpty());
        assertTrue(parser.parse(stream("<items/>")).isEmpty());
    }

    @Test
    void returnsNullStoreSpecificProtocolWhenNoProtocolSignalExists() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Camera supraveghere Generic", "detectie miscare", 90.0, "https://img/camera.jpg")
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
