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
import static org.junit.jupiter.api.Assertions.assertTrue;

class VonMagParserTest {

    private VonMagParser parser;

    @BeforeEach
    void setUp() {
        parser = new VonMagParser();
    }

    @Test
    void testParse_HappyFlow_ValidSmartDevice() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Camera Smart Dahua", "Camera IP wi-fi. Producator: Dahua", 85.0, "http://poza.ro/senzor.jpg")
        ));

        assertEquals(1, result.size());
        assertEquals("Dahua", result.get(0).getBrand());
    }

    @Test
    void testParse_FilterJunkItems() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Cablu UTP 100m", "Accesorii montaj", 2.5, "")
        ));

        assertTrue(result.isEmpty());
    }

    @Test
    void parseCoversVonMagCategoryRulesAndFallbackMapper() {
        List<DeviceImportDto> result = parser.parse(xml(
                item("Prelungitor smart Wi-Fi", "control aplicatie Tuya", 89.0, "https://img/prelungitor.jpg"),
                item("Termostat smart Netatmo", "monitorizare calitate aer bluetooth", 399.0, "https://img/termostat.jpg"),
                item("Smart gateway Aqara", "gateway bluetooth ble pentru senzori", 240.0, "https://img/gateway.jpg"),
                item("Videointerfon IP Hikvision", "monitor videointerfon pentru casa", 720.0, "https://img/interfon.jpg"),
                item("Priza inteligenta Shelly Plug", "monitorizare consum wi-fi", 115.0, "https://img/priza.jpg"),
                item("Senzor zigbee Aqara", "senzor usa wireless", 75.0, "https://img/senzor.jpg"),
                item("Detector wireless PIR + camera", "ajax wireless smart", 180.0, "https://img/pir.jpg"),
                item("Bec led smart Philips Hue", "zigbee google home alexa", 130.0, "https://img/bec.jpg"),
                item("Camera IP TP-LINK", "camera supraveghere poe", 260.0, "https://img/camera.jpg"),
                item("Router Wi-Fi TP-LINK", "router wireless mesh", 310.0, "https://img/router.jpg"),
                item("Aspirator robot Xiaomi", "robot vacuum smart", 1200.0, "https://img/robot.jpg")
        ));

        Map<String, Integer> categories = result.stream()
                .collect(Collectors.toMap(DeviceImportDto::getName, DeviceImportDto::getCategoryId));

        assertEquals(11, result.size());
        assertEquals(2, categories.get("Prelungitor smart Wi-Fi"));
        assertEquals(4, categories.get("Termostat smart Netatmo"));
        assertEquals(5, categories.get("Smart gateway Aqara"));
        assertEquals(6, categories.get("Videointerfon IP Hikvision"));
        assertEquals(7, categories.get("Priza inteligenta Shelly Plug"));
        assertEquals(8, categories.get("Senzor zigbee Aqara"));
        assertEquals(8, categories.get("Detector wireless PIR + camera"));
        assertEquals(13, categories.get("Bec led smart Philips Hue"));
        assertEquals(1, categories.get("Camera IP TP-LINK"));
        assertEquals(12, categories.get("Router Wi-Fi TP-LINK"));
        assertEquals(11, categories.get("Aspirator robot Xiaomi"));
    }

    @Test
    void parseExtractsBrandProtocolImageAndCleansText() {
        List<DeviceImportDto> result = parser.parse(xml(
                "<item>" +
                        "<title><![CDATA[Priza smart &amp; monitorizare TP-LINK]]></title>" +
                        "<description><![CDATA[Producator: TP-LINK<br/>Protocol Matter si Wi-Fi]]></description>" +
                        "<price>149.99</price>" +
                        "<image_urls> https://img/one.jpg , https://img/two.jpg </image_urls>" +
                        "<aff_code> https://shop/item </aff_code>" +
                        "</item>",
                item("Senzor usa Fibaro", "z-wave wireless", 199.0, ""),
                item("Releu smart Sonoff", "rf433 touch control aplicatie", 54.0, "https://img/releu.jpg")
        ));

        DeviceImportDto first = result.stream()
                .filter(dto -> dto.getName().contains("TP-LINK"))
                .findFirst()
                .orElseThrow();

        assertEquals("TP-Link", first.getBrand());
        assertEquals("Matter", first.getCommunicationProtocol());
        assertEquals("https://img/one.jpg", first.getImageUrl());
        assertEquals("https://shop/item", first.getProductUrl());

        assertTrue(result.stream().anyMatch(dto -> "Z-Wave".equals(dto.getCommunicationProtocol())));
        assertTrue(result.stream().anyMatch(dto -> "RF 433MHz".equals(dto.getCommunicationProtocol())));
    }

    @Test
    void parseSkipsInvalidJunkAndMalformedFeeds() {
        List<DeviceImportDto> result = parser.parse(xml(
                "<item><description>missing title</description><price>10</price><aff_code>https://shop/no-title</aff_code></item>",
                "<item><title>Camera IP fara pret</title><description>poe</description><aff_code>https://shop/no-price</aff_code></item>",
                "<item><title>Camera IP fara link</title><description>poe</description><price>99</price></item>",
                item("Camera auto DVR", "dash cam g-sensor", 220.0, "https://img/auto.jpg"),
                item("Bec led simplu", "iluminat clasic basic", 20.0, "https://img/led.jpg"),
                item("Priza simpla modulara", "model clasic", 12.0, "https://img/priza.jpg")
        ));

        assertTrue(result.isEmpty());
        assertTrue(parser.parse(stream("<items><item>")).isEmpty());
        assertTrue(parser.parse(stream("<items/>")).isEmpty());
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
