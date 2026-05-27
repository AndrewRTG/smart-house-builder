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
        return new ByteArrayInputStream("<items><item><title>broken</title></item></items>".getBytes(StandardCharsets.UTF_8));
    }

    private String item(String title, String description, String price, String imageUrls) {
        StringBuilder builder = new StringBuilder("<item>");
        if (title != null) builder.append("<title>").append(title).append("</title>");
        if (price != null) builder.append("<price>").append(price).append("</price>");
        if (imageUrls != null) builder.append("<image_urls>").append(imageUrls).append("</image_urls>");
        if (description != null) builder.append("<description>").append(description).append("</description>");
        builder.append("<aff_code>http://link.ro</aff_code>");
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
        assertThrows(UnsupportedOperationException.class, () -> factory.getParserForStore("unknown"));
    }

    @Test
    void caseSmartParserMapsSmartDevicesBrandsImagesAndCategories() {
        CaseSmartParser parser = new CaseSmartParser();
        String body = ""
                + item("Camera smart BrandLabel", "Brand : Aqara camera ip supraveghere", "120.0", "first.jpg,second.jpg")
                + item("Livolo smart intrerupator", "touch switch wi-fi", "80.0", null)
                + item("Scaun simplu", "mobilier fara automatizare", "20.0", null);

        List<DeviceImportDto> devices = parser.parse(xml(body));
        Map<String, DeviceImportDto> mapped = byName(devices);

        assertEquals("CASESMART", parser.getStoreIdentifier());
        assertFalse(mapped.containsKey("Scaun simplu")); // Verificăm că ignoră produsele nedorite
        assertTrue(devices.size() >= 2);

        DeviceImportDto camera = mapped.get("Camera smart BrandLabel");
        assertNotNull(camera);
        assertEquals("first.jpg", camera.getImageUrl());
        assertEquals("Aqara", camera.getBrand());
        assertEquals(1, camera.getCategoryId());

        DeviceImportDto switchDevice = mapped.get("Livolo smart intrerupator");
        assertNotNull(switchDevice);
        assertEquals("Livolo", switchDevice.getBrand());
        assertEquals(7, switchDevice.getCategoryId());
    }

    @Test
    void vonMagParserMapsSmartDevicesBrandsImagesAndCategories() {
        VonMagParser parser = new VonMagParser();
        String body = ""
                + item("Camera Smart IP Huawei", "camere supraveghere", "120.0", "cam.jpg,other.jpg")
                + item("Schneider prelungitor smart", "prelungitor wi-fi", "40.0", null)
                + item("Masa simpla", "mobilier", "20.0", null);

        Map<String, DeviceImportDto> mapped = byName(parser.parse(xml(body)));

        assertEquals("VONMAG", parser.getStoreIdentifier());
        assertFalse(mapped.containsKey("Masa simpla"));

        DeviceImportDto camera = mapped.get("Camera Smart IP Huawei");
        assertNotNull(camera);
        assertEquals("cam.jpg", camera.getImageUrl());
        assertEquals("Huawei", camera.getBrand());
        assertEquals(1, camera.getCategoryId());

        DeviceImportDto prelungitor = mapped.get("Schneider prelungitor smart");
        assertNotNull(prelungitor);
        assertEquals("Schneider", prelungitor.getBrand());
        assertEquals(2, prelungitor.getCategoryId());
    }

    @Test
    void rovisionParserFiltersJunkAndMapsBrandsImagesAndCategories() {
        RovisionParser parser = new RovisionParser();
        String body = ""
                + item("HIKVISION camera IP", "camera supraveghere", "120.0", "cam.jpg,second.jpg")
                + item("Camera ip REOLINK", "camera supraveghere", "160.0", null)
                + item("Cablu camera IP", "camera pentru test filtru junk", "10.0", null);

        List<DeviceImportDto> devices = parser.parse(xml(body));
        Map<String, DeviceImportDto> mapped = byName(devices);

        assertEquals("ROVISION", parser.getStoreIdentifier());
        assertFalse(mapped.containsKey("Cablu camera IP"));

        DeviceImportDto camera = mapped.get("HIKVISION camera IP");
        assertNotNull(camera);
        assertEquals("cam.jpg", camera.getImageUrl());
        assertEquals("HIKVISION", camera.getBrand());
        assertEquals(1, camera.getCategoryId());

        DeviceImportDto reolink = mapped.get("Camera ip REOLINK");
        assertNotNull(reolink);
        assertEquals("REOLINK", reolink.getBrand());
    }
}