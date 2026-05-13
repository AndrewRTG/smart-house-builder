package gr.A4.SmartHouseBuilder.service.parser;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class StoreParserTest {

    private InputStream xml(String body) {
        return new ByteArrayInputStream(("<items>" + body + "</items>").getBytes(StandardCharsets.UTF_8));
    }

    private InputStream invalidXml() {
        return new ByteArrayInputStream("<items><item><title>broken".getBytes(StandardCharsets.UTF_8));
    }

    private String item(String title, String description) {
        return item(title, description, "99.5", null);
    }

    private String item(String title, String description, String price, String imageUrls) {
        StringBuilder builder = new StringBuilder("<item>");
        if (title != null) builder.append("<title>").append(title).append("</title>");
        if (price != null) builder.append("<price>").append(price).append("</price>");
        if (imageUrls != null) builder.append("<image_urls>").append(imageUrls).append("</image_urls>");
        if (description != null) builder.append("<description>").append(description).append("</description>");
        return builder.append("</item>").toString();
    }

    private Map<String, DeviceImportDto> byName(List<DeviceImportDto> devices) {
        return devices.stream().collect(Collectors.toMap(DeviceImportDto::getName, Function.identity()));
    }

    @Test
    void parserFactoryRegistersParsersCaseInsensitivelyAndRejectsInvalidStores() {
        StoreParser caseSmart = new CaseSmartParser();
        StoreParser vonMag = new VonMagParser();
        ParserFactory factory = new ParserFactory(List.of(caseSmart, vonMag));

        assertSame(caseSmart, factory.getParserForStore("casesmart"));
        assertSame(vonMag, factory.getParserForStore(" VONMAG ".trim()));

        assertThrows(IllegalArgumentException.class, () -> factory.getParserForStore(" "));
        assertThrows(IllegalArgumentException.class, () -> factory.getParserForStore(null));
        assertThrows(UnsupportedOperationException.class, () -> factory.getParserForStore("unknown"));
    }

    @Test
    void caseSmartParserMapsSmartDevicesBrandsImagesAndCategories() {
        CaseSmartParser parser = new CaseSmartParser();
        String body = ""
                + item("Camera smart BrandLabel", "Brand : Aqara camera supraveghere", "120.0", " first.jpg , second.jpg ")
                + item("Livolo smart intrerupator", "touch switch", "80.0", null)
                + item("Generic smart prelungitor", "prelungitor smart", "40.0", null)
                + item("Generic smart consola", "playstation smart", "50.0", null)
                + item("Generic smart frigider", "electrocasnic smart", "60.0", null)
                + item("Generic smart hub", "gateway xvr nvr", "70.0", null)
                + item("Generic smart monitor", "display smart", "80.0", null)
                + item("Generic smart priza", "socket releu intrerupator", "90.0", null)
                + item("Generic smart senzor", "detector sirena buton meter", "100.0", null)
                + item("Generic smart audio", "boxa soundbar", "110.0", null)
                + item("Generic smart tv ", "televizor", "120.0", null)
                + item("Generic smart robot", "aspirator robot", "130.0", null)
                + item("Generic smart router", "switch access point", "140.0", null)
                + item("Generic smart other", "smart unrelated", "150.0", null)
                + item("Scaun simplu", "mobilier fara automatizare", "20.0", null);

        List<DeviceImportDto> devices = parser.parse(xml(body));
        Map<String, DeviceImportDto> mapped = byName(devices);

        assertEquals("CASESMART", parser.getStoreIdentifier());
        assertFalse(mapped.containsKey("Scaun simplu"));
        assertEquals(14, devices.size());
        assertEquals("first.jpg", mapped.get("Camera smart BrandLabel").getImageUrl());
        assertEquals("Aqara", mapped.get("Camera smart BrandLabel").getBrand());
        assertEquals("Livolo", mapped.get("Livolo smart intrerupator").getBrand());
        assertEquals("Generic", mapped.get("Generic smart other").getBrand());
        assertEquals(1, mapped.get("Camera smart BrandLabel").getCategoryId());
        assertEquals(2, mapped.get("Generic smart prelungitor").getCategoryId());
        assertEquals(3, mapped.get("Generic smart consola").getCategoryId());
        assertEquals(4, mapped.get("Generic smart frigider").getCategoryId());
        assertEquals(5, mapped.get("Generic smart hub").getCategoryId());
        assertEquals(6, mapped.get("Generic smart monitor").getCategoryId());
        assertEquals(7, mapped.get("Generic smart priza").getCategoryId());
        assertEquals(8, mapped.get("Generic smart senzor").getCategoryId());
        assertEquals(9, mapped.get("Generic smart audio").getCategoryId());
        assertEquals(10, mapped.get("Generic smart tv ").getCategoryId());
        assertEquals(11, mapped.get("Generic smart robot").getCategoryId());
        assertEquals(12, mapped.get("Generic smart router").getCategoryId());
        assertNull(mapped.get("Generic smart other").getCategoryId());
        assertTrue(parser.parse(invalidXml()).isEmpty());
        assertTrue(parser.parse(xml("")).isEmpty());
    }

    @Test
    void vonMagParserMapsSmartDevicesBrandsImagesAndCategories() {
        VonMagParser parser = new VonMagParser();
        String body = ""
                + item("Huawei smart camera", "camere supraveghere", "120.0", "cam.jpg,other.jpg")
                + item("Schneider smart prelungitor", "prelungitor", "40.0", null)
                + item("Dahua smart consola", "xbox", "50.0", null)
                + item("Hikvision smart frigider", "electrocasnic", "60.0", null)
                + item("G-U smart hub", "gateway xvr nvr", "70.0", null)
                + item("Generic smart monitor", "display", "80.0", null)
                + item("Generic smart priza", "socket releu", "90.0", null)
                + item("Generic smart senzor", "detector sirena meter", "100.0", null)
                + item("Generic smart audio", "boxa soundbar", "110.0", null)
                + item("Generic smart tv ", "televizor", "120.0", null)
                + item("Generic smart robot", "aspirator robot", "130.0", null)
                + item("Generic smart router", "switch access point", "140.0", null)
                + item("Generic smart other", "smart unrelated", "150.0", null)
                + item("Masa simpla", "mobilier", "20.0", null);

        Map<String, DeviceImportDto> mapped = byName(parser.parse(xml(body)));

        assertEquals("VONMAG", parser.getStoreIdentifier());
        assertFalse(mapped.containsKey("Masa simpla"));
        assertEquals("cam.jpg", mapped.get("Huawei smart camera").getImageUrl());
        assertEquals("Huawei", mapped.get("Huawei smart camera").getBrand());
        assertEquals("Schneider", mapped.get("Schneider smart prelungitor").getBrand());
        assertEquals("Dahua", mapped.get("Dahua smart consola").getBrand());
        assertEquals("Hikvision", mapped.get("Hikvision smart frigider").getBrand());
        assertEquals("G-U", mapped.get("G-U smart hub").getBrand());
        assertEquals("Generic", mapped.get("Generic smart other").getBrand());
        assertEquals(1, mapped.get("Huawei smart camera").getCategoryId());
        assertEquals(2, mapped.get("Schneider smart prelungitor").getCategoryId());
        assertEquals(3, mapped.get("Dahua smart consola").getCategoryId());
        assertEquals(4, mapped.get("Hikvision smart frigider").getCategoryId());
        assertEquals(5, mapped.get("G-U smart hub").getCategoryId());
        assertEquals(6, mapped.get("Generic smart monitor").getCategoryId());
        assertEquals(7, mapped.get("Generic smart priza").getCategoryId());
        assertEquals(8, mapped.get("Generic smart senzor").getCategoryId());
        assertEquals(9, mapped.get("Generic smart audio").getCategoryId());
        assertEquals(10, mapped.get("Generic smart tv ").getCategoryId());
        assertEquals(11, mapped.get("Generic smart robot").getCategoryId());
        assertEquals(12, mapped.get("Generic smart router").getCategoryId());
        assertNull(mapped.get("Generic smart other").getCategoryId());
        assertTrue(parser.parse(invalidXml()).isEmpty());
    }

    @Test
    void rovisionParserFiltersJunkAndMapsBrandsImagesAndCategories() {
        RovisionParser parser = new RovisionParser();
        String body = ""
                + item("HIKVISION camera IP", "camera supraveghere", "120.0", " cam.jpg , second.jpg ")
                + item("Smart prelungitor", "generic smart prelungitor", "40.0", null)
                + item("Smart consola", "playstation smart", "50.0", null)
                + item("Smart frigider", "electrocasnic smart", "60.0", null)
                + item("Smart NVR", "dvr xvr centrala hub gateway", "70.0", null)
                + item("Smart interfon", "monitor display ecran", "80.0", null)
                + item("Smart priza", "releu", "90.0", null)
                + item("Smart senzor", "detector sirena contact magnetic yala alarma", "100.0", null)
                + item("Smart audio", "boxa audio", "110.0", null)
                + item("Smart tv ", "televizor", "120.0", null)
                + item("Smart robot", "aspirator robot", "130.0", null)
                + item("Smart router", "switch access point antena convertor", "140.0", null)
                + item("Smart other", "smart unrelated PRODUCATOR: Ajax, wireless", "150.0", null)
                + item("Generic smart desc brand", "camera cu brand REOLINK in descriere", "160.0", null)
                + item(null, "smart hub PRODUCATOR: Yale; alarm", "170.0", null)
                + item("Cablu camera IP", "camera pentru test filtru junk", "10.0", null);

        List<DeviceImportDto> devices = parser.parse(xml(body));
        Map<String, DeviceImportDto> mapped = byName(devices);

        assertEquals("ROVISION", parser.getStoreIdentifier());
        assertFalse(mapped.containsKey("Cablu camera IP"));
        assertEquals(15, devices.size());
        assertEquals("cam.jpg", mapped.get("HIKVISION camera IP").getImageUrl());
        assertEquals("HIKVISION", mapped.get("HIKVISION camera IP").getBrand());
        assertEquals("AJAX", mapped.get("Smart other").getBrand());
        assertEquals("REOLINK", mapped.get("Generic smart desc brand").getBrand());
        assertEquals("YALE", devices.stream().filter(d -> d.getName() == null).findFirst().orElseThrow().getBrand());
        assertEquals(1, mapped.get("HIKVISION camera IP").getCategoryId());
        assertEquals(2, mapped.get("Smart prelungitor").getCategoryId());
        assertEquals(3, mapped.get("Smart consola").getCategoryId());
        assertEquals(4, mapped.get("Smart frigider").getCategoryId());
        assertEquals(5, mapped.get("Smart NVR").getCategoryId());
        assertEquals(6, mapped.get("Smart interfon").getCategoryId());
        assertEquals(7, mapped.get("Smart priza").getCategoryId());
        assertEquals(8, mapped.get("Smart senzor").getCategoryId());
        assertEquals(9, mapped.get("Smart audio").getCategoryId());
        assertEquals(10, mapped.get("Smart tv ").getCategoryId());
        assertEquals(11, mapped.get("Smart robot").getCategoryId());
        assertEquals(12, mapped.get("Smart router").getCategoryId());
        assertNull(mapped.get("Smart other").getCategoryId());
        assertTrue(parser.parse(invalidXml()).isEmpty());
        assertTrue(parser.parse(xml("")).isEmpty());
    }
}
