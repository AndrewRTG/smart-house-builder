package gr.A4.SmartHouseBuilder.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.endpoint.entity.Device;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.endpoint.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    private final DeviceRepository deviceRepository;
    private final SetupRepository setupRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @PostMapping("/seed-devices")
    public ResponseEntity<String> seedDevices() {
        List<Device> devices = List.of(
            Device.builder()
                    .name("Amazon Alexa Echo Dot")
                    .brand("Amazon")
                    .type("Smart Speaker")
                    .bestPrice(59.99)
                    .build(),
            Device.builder()
                    .name("Philips Hue Smart Bulb")
                    .brand("Philips")
                    .type("Smart Light")
                    .bestPrice(49.99)
                    .build(),
            Device.builder()
                    .name("Google Nest Thermostat")
                    .brand("Google")
                    .type("Thermostat")
                    .bestPrice(249.99)
                    .build(),
            Device.builder()
                    .name("LIFX A19 Color A19")
                    .brand("LIFX")
                    .type("Smart Light")
                    .bestPrice(39.99)
                    .build(),
            Device.builder()
                    .name("Nanoleaf Essentials Light Strip")
                    .brand("Nanoleaf")
                    .type("RGB Light")
                    .bestPrice(79.99)
                    .build(),
            Device.builder()
                    .name("August Smart Lock Pro")
                    .brand("August")
                    .type("Smart Lock")
                    .bestPrice(329.99)
                    .build(),
            Device.builder()
                    .name("Sonos Arc Soundbar")
                    .brand("Sonos")
                    .type("Speaker")
                    .bestPrice(799.99)
                    .build(),
            Device.builder()
                    .name("Wyze Cam v3")
                    .brand("Wyze")
                    .type("Security Camera")
                    .bestPrice(29.99)
                    .build(),
            Device.builder()
                    .name("Eve MotionBlinds")
                    .brand("Eve")
                    .type("Smart Blinds")
                    .bestPrice(139.99)
                    .build(),
            Device.builder()
                    .name("Meross Smart Plug")
                    .brand("Meross")
                    .type("Smart Plug")
                    .bestPrice(24.99)
                    .build()
        );

        deviceRepository.saveAll(devices);
        return ResponseEntity.ok("✅ Seeded " + devices.size() + " test devices successfully!");
    }

    @PostMapping("/seed-setups")
    public ResponseEntity<String> seedSetups() {
        User demoUser = userRepository.findByUsername("demo")
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No users found. Please register first.")));

        List<Setup> setups = List.of(
            Setup.builder()
                    .user(demoUser)
                    .name("Living Room Smart Setup")
                    .description("Perfect setup for a modern living room with smart lights, speaker, and thermostat control")
                    .deviceIds(serializeIds(List.of(1L, 2L, 3L)))
                    .publicSetup(true)
                    .status(SetupStatus.PUBLISHED)
                    .build(),
            Setup.builder()
                    .user(demoUser)
                    .name("Bedroom Automation")
                    .description("Cozy bedroom with ambient lighting, temperature control, and smart lock")
                    .deviceIds(serializeIds(List.of(2L, 3L, 6L)))
                    .publicSetup(true)
                    .status(SetupStatus.PUBLISHED)
                    .build(),
            Setup.builder()
                    .user(demoUser)
                    .name("Kitchen Entertainment Hub")
                    .description("Entertainment and cooking zone with speakers, lights, and smart plugs")
                    .deviceIds(serializeIds(List.of(1L, 4L, 5L, 10L)))
                    .publicSetup(true)
                    .status(SetupStatus.PUBLISHED)
                    .build(),
            Setup.builder()
                    .user(demoUser)
                    .name("Home Security System")
                    .description("Comprehensive security setup with cameras, smart lock, and automation")
                    .deviceIds(serializeIds(List.of(6L, 8L, 9L)))
                    .publicSetup(true)
                    .status(SetupStatus.PUBLISHED)
                    .build(),
            Setup.builder()
                    .user(demoUser)
                    .name("Office Workspace")
                    .description("Productive office environment with lighting control and sound management")
                    .deviceIds(serializeIds(List.of(1L, 4L, 7L)))
                    .publicSetup(true)
                    .status(SetupStatus.PUBLISHED)
                    .build()
        );

        setupRepository.saveAll(setups);
        return ResponseEntity.ok("✅ Seeded " + setups.size() + " test setups successfully!");
    }

    @PostMapping("/seed-articles")
    public ResponseEntity<String> seedArticles() {
        User demoUser = userRepository.findByUsername("demo")
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No users found. Please register first.")));

        List<Article> articles = List.of(
            Article.builder()
                    .user(demoUser)
                    .title("Getting Started with Smart Home Automation")
                    .content("Learn the basics of home automation and how to choose the right devices for your needs. This guide covers essential concepts like protocols, compatibility, and setup best practices.")
                    .deviceIds(serializeIds(List.of(1L, 2L, 3L)))
                    .build(),
            Article.builder()
                    .user(demoUser)
                    .title("Energy Efficiency with Smart Devices")
                    .content("Discover how smart thermostats and plugs can reduce your energy consumption and lower your bills. We'll explore real-world scenarios and calculated savings.")
                    .deviceIds(serializeIds(List.of(3L, 10L)))
                    .build(),
            Article.builder()
                    .user(demoUser)
                    .title("Creating the Perfect Ambient Lighting")
                    .content("Master the art of smart lighting to create mood and atmosphere in every room. Learn color temperature, brightness settings, and automation schedules.")
                    .deviceIds(serializeIds(List.of(2L, 4L, 5L)))
                    .build(),
            Article.builder()
                    .user(demoUser)
                    .title("Smart Home Security Best Practices")
                    .content("Secure your smart home from hackers and intruders. This article covers network security, device authentication, and privacy protection strategies.")
                    .deviceIds(serializeIds(List.of(6L, 8L)))
                    .build(),
            Article.builder()
                    .user(demoUser)
                    .title("Integration Guide: Multi-Protocol Setups")
                    .content("Learn how to integrate devices using different protocols (Zigbee, Z-Wave, Wi-Fi) and create a unified smart home ecosystem that works seamlessly.")
                    .deviceIds(serializeIds(List.of(1L, 2L, 3L, 4L, 6L)))
                    .build()
        );

        articleRepository.saveAll(articles);
        return ResponseEntity.ok("✅ Seeded " + articles.size() + " test articles successfully!");
    }

    private String serializeIds(List<Long> ids) {
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (Exception e) {
            return "[]";
        }
    }
}
