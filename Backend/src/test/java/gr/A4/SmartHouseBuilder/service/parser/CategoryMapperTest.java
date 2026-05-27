package gr.A4.SmartHouseBuilder.service.parser;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CategoryMapperTest {

    @Test
    void mapsRepresentativeSupportedCategories() {
        Map<String, Integer> cases = Map.ofEntries(
                Map.entry("Bec smart Philips Hue", 13),
                Map.entry("Senzor temperatura Zigbee", 8),
                Map.entry("Camera IP Wi-Fi Hikvision", 1),
                Map.entry("Prelungitor smart Wi-Fi", 2),
                Map.entry("PlayStation 5 consola gaming", 3),
                Map.entry("Purificator de aer smart Wi-Fi", 4),
                Map.entry("Centrala alarma AX Pro wireless", 5),
                Map.entry("Monitor videointerfon interior", 6),
                Map.entry("Priza inteligenta Wi-Fi", 7),
                Map.entry("Boxa smart Alexa", 9),
                Map.entry("Televizor smart Android TV", 10),
                Map.entry("Aspirator robot Roborock", 11),
                Map.entry("Router wireless mesh", 12)
        );

        cases.forEach((title, expected) -> assertEquals(expected, CategoryMapper.determineCategoryId(title), title));
    }

    @Test
    void usesDescriptionForCompoundRulesAndNormalizesText() {
        assertEquals(1, CategoryMapper.determineCategoryId("Kit supraveghere cu camera", "poe onvif"));
        assertEquals(5, CategoryMapper.determineCategoryId("Centrala efractie", "smart home tcp/ip wireless"));
        assertEquals(7, CategoryMapper.determineCategoryId("Releu inteligent Tapo Wi-Fi", "control din aplicatie"));
        assertEquals("camera ip smart", CategoryMapper.normalize("Camera&nbsp;IP <b>smart</b>"));
    }

    @Test
    void excludesUnsupportedAccessoriesAndAmbiguousProducts() {
        assertNull(CategoryMapper.determineCategoryId(null));
        assertNull(CategoryMapper.determineCategoryId("   "));
        assertNull(CategoryMapper.determineCategoryId("NVR Hikvision 8 canale"));
        assertNull(CategoryMapper.determineCategoryId("Suport camera metalic"));
        assertNull(CategoryMapper.determineCategoryId("Hub USB-C pentru laptop"));
        assertNull(CategoryMapper.determineCategoryId("Switch poe gigabit"));
        assertNull(CategoryMapper.determineCategoryId("Prelungitor clasic"));
        assertNull(CategoryMapper.determineCategoryId("Router range extender"));
        assertNull(CategoryMapper.determineCategoryId("Decoratiune fara categorie"));
    }

    @Test
    void keepsCameraProductsEvenWhenTheyContainAccessoryWords() {
        assertEquals(1, CategoryMapper.determineCategoryId("Suport camera IP Wi-Fi PTZ"));
        assertTrue(CategoryMapper.normalize("Camera Ã¢ smart È™i Å£est").contains("camera"));
    }
}
