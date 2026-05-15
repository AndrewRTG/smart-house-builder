package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceSuggestionAlgorithmServiceTest {

    @Mock
    private HardwareDeviceRepository deviceRepository;

    @InjectMocks
    private DeviceSuggestionAlgorithmService algorithmService;

    private HardwareDevice createDevice(Long id, int categoryId, String name, String brand, Double price, String protocol, String specs, String desc) {
        HardwareDevice device = new HardwareDevice();
        device.setId(id);
        device.setCategoryId(categoryId);
        device.setName(name);
        device.setBrand(brand);
        device.setPrice(price);
        device.setCommunicationProtocol(protocol);
        device.setSpecifications(specs);
        device.setDescription(desc);
        return device;
    }

    @Test
    void testParseCriteriaAndBudget_AllEdgeCases() {
        when(deviceRepository.findAll()).thenReturn(Collections.emptyList());

        assertTrue(algorithmService.getSmartSuggestions(null).isEmpty());
        assertTrue(algorithmService.getSmartSuggestions("").isEmpty());

        String criteria1 = "Buget: 1000 EUR. InvalidPartWithoutColon. Categorii dorite: Oricare";
        assertTrue(algorithmService.getSmartSuggestions(criteria1).isEmpty());

        String criteria2 = "Buget: BaniMulti. Categorii dorite: Toate";
        assertTrue(algorithmService.getSmartSuggestions(criteria2).isEmpty());

        String criteria3 = "Buget: 100.5.5 EUR. Categorii dorite: Toate";
        assertTrue(algorithmService.getSmartSuggestions(criteria3).isEmpty());

        // Test pentru "Oricare" (pentru a acoperi `categoriesStr.equalsIgnoreCase("Oricare")`)
        assertTrue(algorithmService.getSmartSuggestions("Buget: 1000 EUR. Categorii dorite: Oricare").isEmpty());
    }

    @Test
    void testFilterByEcosystem_AllBranchesAndNulls() {
        HardwareDevice nullPropsDev = createDevice(1L, 1, "Null", null, 10.0, null, null, null);

        // --- APPLE & SHORT-CIRCUITS ---
        HardwareDevice appleAmazon = createDevice(2L, 1, "Amz", "Amazon", 10.0, "WIFI", "", "");
        HardwareDevice appleGoogle = createDevice(3L, 1, "Goo", "Google", 10.0, "WIFI", "", "");
        HardwareDevice appleSamsung = createDevice(4L, 1, "Sam", "Samsung", 10.0, "WIFI", "", "");

        HardwareDevice appleMatter = createDevice(5L, 1, "Mat", "Any", 10.0, "MATTER", "", "");
        HardwareDevice appleThread = createDevice(6L, 1, "Thr", "Any", 10.0, "THREAD", "", "");
        HardwareDevice appleBrand = createDevice(7L, 1, "App", "Apple", 10.0, "ZIGBEE", "", "");

        // Combinațiile pentru homekit/airplay (Short-circuit testing pt specificatii si descriere)
        HardwareDevice appleSpecHomekit = createDevice(8L, 1, "SH", "Any", 10.0, "BLUETOOTH", "homekit", "");
        HardwareDevice appleSpecAirplay = createDevice(9L, 1, "SA", "Any", 10.0, "WIFI", "airplay", "");
        HardwareDevice appleDescHomekit = createDevice(10L, 1, "DH", "Any", 10.0, "WIFI", "none", "homekit");
        HardwareDevice appleDescAirplay = createDevice(11L, 1, "DA", "Any", 10.0, "BLUETOOTH", "none", "airplay");
        HardwareDevice appleReject = createDevice(12L, 1, "Rej", "Any", 10.0, "BLUETOOTH", "none", "none");

        // --- GOOGLE & ALEXA SHORT-CIRCUITS ---
        HardwareDevice gAmazon = createDevice(13L, 1, "GAmz", "Amazon", 10.0, "WIFI", "", "");
        HardwareDevice gApple = createDevice(14L, 1, "GApp", "Apple", 10.0, "WIFI", "", "");
        HardwareDevice gWifi = createDevice(15L, 1, "GWifi", "Any", 10.0, "WIFI", "", "");
        HardwareDevice gMatter = createDevice(16L, 1, "GMat", "Any", 10.0, "MATTER", "", "");
        HardwareDevice gZigbee = createDevice(17L, 1, "GZig", "Any", 10.0, "ZIGBEE", "", "");
        HardwareDevice gReject = createDevice(18L, 1, "GRej", "Any", 10.0, "THREAD", "", "");

        when(deviceRepository.findAll()).thenReturn(Arrays.asList(
                nullPropsDev,
                appleAmazon, appleGoogle, appleSamsung, appleMatter, appleThread, appleBrand,
                appleSpecHomekit, appleSpecAirplay, appleDescHomekit, appleDescAirplay, appleReject,
                gAmazon, gApple, gWifi, gMatter, gZigbee, gReject
        ));

        algorithmService.getSmartSuggestions("Buget: 1000. Ecosistem: Apple. Categorii dorite: Toate");
        algorithmService.getSmartSuggestions("Buget: 1000. Ecosistem: Google. Categorii dorite: Toate");
        algorithmService.getSmartSuggestions("Buget: 1000. Ecosistem: Alexa. Categorii dorite: Toate");
    }

    @Test
    void testFilterByLevel_AllBranches() {
        HardwareDevice nullSpec = createDevice(1L, 1, "N", "B", 10.0, "WIFI", null, "");
        HardwareDevice poe = createDevice(2L, 1, "P", "B", 10.0, "WIFI", "\"power_source\":\"poe\"", "");
        HardwareDevice wired = createDevice(3L, 1, "W", "B", 10.0, "WIFI", "\"power_source\":\"wired\"", "");
        HardwareDevice nvr = createDevice(4L, 1, "NVR", "B", 10.0, "WIFI", "\"storage_type\":\"nvr\"", "");
        HardwareDevice inWall = createDevice(5L, 1, "IW", "B", 10.0, "WIFI", "in_wall", "");
        HardwareDevice relay = createDevice(6L, 1, "R", "B", 10.0, "WIFI", "relay", "");
        HardwareDevice okPnP = createDevice(7L, 1, "OK", "B", 10.0, "WIFI", "battery", "");

        when(deviceRepository.findAll()).thenReturn(Arrays.asList(nullSpec, poe, wired, nvr, inWall, relay, okPnP));

        // Acoperim ambele moduri de a exprima incepator (Plug & Play vs beginner)
        algorithmService.getSmartSuggestions("Buget: 1000. Nivel: beginner. Categorii dorite: Toate");
        algorithmService.getSmartSuggestions("Buget: 1000. Nivel: Plug & Play. Categorii dorite: Toate");
        algorithmService.getSmartSuggestions("Buget: 1000. Nivel: Intermediate. Categorii dorite: Toate");
    }

    @Test
    void testFilterByTargetCategories_AllSpecifics() {
        HardwareDevice cid5 = createDevice(1L, 5, "H", "B", 10.0, "WIFI", "", "");
        HardwareDevice cid12 = createDevice(2L, 12, "R", "B", 10.0, "WIFI", "", "");

        HardwareDevice cid9Oricare = createDevice(3L, 9, "O", "X", 10.0, "WIFI", "", "");
        HardwareDevice cid9Apple = createDevice(4L, 9, "A", "Apple", 10.0, "WIFI", "", "");
        HardwareDevice cid9Google = createDevice(5L, 9, "G", "Google", 10.0, "WIFI", "", "");
        HardwareDevice cid9Amazon = createDevice(6L, 9, "Am", "Amazon", 10.0, "WIFI", "", "");

        // Scurt-circuite Security (1 si 8-uri specifice)
        HardwareDevice sec1 = createDevice(7L, 1, "S1", "B", 10.0, "WIFI", "", "");
        HardwareDevice sec8smoke = createDevice(8L, 8, "S8s", "B", 10.0, "WIFI", "smoke", "");
        HardwareDevice sec8gas = createDevice(9L, 8, "S8g", "B", 10.0, "WIFI", "gas", "");
        HardwareDevice sec8contact = createDevice(10L, 8, "S8c", "B", 10.0, "WIFI", "contact", "");
        HardwareDevice sec8motion = createDevice(11L, 8, "S8m", "B", 10.0, "WIFI", "motion", "");
        HardwareDevice sec8leak = createDevice(12L, 8, "S8l", "B", 10.0, "WIFI", "water_leak", "");

        // Scurt-circuite Comfort (4, 11, 8-uri specifice)
        HardwareDevice com4 = createDevice(13L, 4, "C4", "B", 10.0, "WIFI", "", "");
        HardwareDevice com11 = createDevice(14L, 11, "C11", "B", 10.0, "WIFI", "", "");
        HardwareDevice com8temp = createDevice(15L, 8, "C8t", "B", 10.0, "WIFI", "temperature", "");
        HardwareDevice com8hum = createDevice(16L, 8, "C8h", "B", 10.0, "WIFI", "humidity", "");
        HardwareDevice com8lum = createDevice(17L, 8, "C8l", "B", 10.0, "WIFI", "luminance", "");
        HardwareDevice com8motion = createDevice(18L, 8, "C8m", "B", 10.0, "WIFI", "motion", ""); // Motion inclus in comfort

        // Scurt-circuite Energy
        HardwareDevice ene2 = createDevice(19L, 2, "E2", "B", 10.0, "WIFI", "", "");
        HardwareDevice ene7 = createDevice(20L, 7, "E7", "B", 10.0, "WIFI", "", "");

        // Scurt-circuite Entertainment (3, 6, 9, 10)
        HardwareDevice ent3 = createDevice(21L, 3, "E3", "B", 10.0, "WIFI", "", "");
        HardwareDevice ent6 = createDevice(22L, 6, "E6", "B", 10.0, "WIFI", "", "");
        HardwareDevice ent10 = createDevice(23L, 10, "E10", "B", 10.0, "WIFI", "", "");

        when(deviceRepository.findAll()).thenReturn(Arrays.asList(
                cid5, cid12, cid9Oricare, cid9Apple, cid9Google, cid9Amazon,
                sec1, sec8smoke, sec8gas, sec8contact, sec8motion, sec8leak,
                com4, com11, com8temp, com8hum, com8lum, com8motion,
                ene2, ene7,
                ent3, ent6, ent10
        ));

        String categories = "security, comfort, energy, entertainment";
        algorithmService.getSmartSuggestions("Buget: 5000. Categorii dorite: " + categories + ". Ecosistem: Oricare");
        algorithmService.getSmartSuggestions("Buget: 5000. Categorii dorite: " + categories + ". Ecosistem: Apple");
        algorithmService.getSmartSuggestions("Buget: 5000. Categorii dorite: " + categories + ". Ecosistem: Google");
        algorithmService.getSmartSuggestions("Buget: 5000. Categorii dorite: " + categories + ". Ecosistem: Alexa");
    }

    @Test
    void testBuildBalancedSetup_AllConditionsAndLimits() {
        HardwareDevice hub1 = createDevice(1L, 5, "H1", "B", 10.0, "WIFI", "", "");
        HardwareDevice hub2 = createDevice(2L, 5, "H2", "B", 15.0, "WIFI", "", "");

        HardwareDevice nullPrice = createDevice(3L, 1, "NP", "B", null, "WIFI", "", "");
        HardwareDevice zeroPrice = createDevice(4L, 1, "ZP", "B", 0.0, "WIFI", "", "");

        HardwareDevice c1 = createDevice(5L, 2, "C1", "B", 10.0, "WIFI", "", "");
        HardwareDevice c2 = createDevice(6L, 2, "C2", "B", 20.0, "WIFI", "", "");
        HardwareDevice c3 = createDevice(7L, 2, "C3", "B", 30.0, "WIFI", "", "");
        HardwareDevice c4 = createDevice(8L, 2, "C4", "B", 40.0, "WIFI", "", "");

        HardwareDevice expensive = createDevice(9L, 3, "Exp", "B", 2000.0, "WIFI", "", "");

        when(deviceRepository.findAll()).thenReturn(Arrays.asList(
                hub1, hub2, nullPrice, zeroPrice, c1, c2, c3, c4, expensive
        ));

        List<HardwareDevice> res = algorithmService.getSmartSuggestions("Buget: 100. Categorii dorite: Toate");

        assertTrue(res.contains(hub1));
        assertTrue(res.contains(hub2));
        assertFalse(res.contains(nullPrice));
        assertFalse(res.contains(zeroPrice));
        assertFalse(res.contains(c4));
        assertFalse(res.contains(expensive));
    }
}