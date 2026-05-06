ackage gr.A4.SmartHouseBuilder.config;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.Role;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Development-only seeder: populates a few public setups and articles so the
 * community page has something to show before the Builder/Catalog teams merge
 * their data in. Runs only on the "dev" profile and only when the tables are
 * empty, so it is safe to leave enabled during development.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SetupRepository setupRepository;
    private final ArticleRepository articleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        long setupCount = setupRepository.count();
        long articleCount = articleRepository.count();
        if (setupCount > 0 || articleCount > 0) {
            log.info("DemoDataSeeder: data already present (setups={}, articles={}), skipping.",
                    setupCount, articleCount);
            return;
        }

        User demo = ensureDemoUser();
        seedSetups(demo);
        seedArticles(demo);

        log.info("DemoDataSeeder: inserted demo setups and articles for user {}",
                demo.getUsername());
    }

    private User ensureDemoUser() {
        return userRepository.findByEmail("demo@smarthouse.local").orElseGet(() -> {
            User u = User.builder()
                    .email("demo@smarthouse.local")
                    .username("smarthouse_demo")
                    .password(passwordEncoder.encode("DemoPass123!"))
                    .role(Role.USER)
                    .verified(true)
                    .mfaEnabled(false)
                    .build();
            return userRepository.save(u);
        });
    }

    private void seedSetups(User demo) {
        List<Setup> seeds = List.of(
                Setup.builder()
                        .user(demo)
                        .name("Cozy Budget Living Room")
                        .description("A minimal smart-home starter pack: smart bulb, motion sensor, and a voice hub. Perfect for a first apartment under $150.")
                        .deviceIds("[1,2,3]")
                        .publicSetup(true)
                        .status(SetupStatus.PUBLISHED)
                        .build(),
                Setup.builder()
                        .user(demo)
                        .name("Full Kitchen Automation")
                        .description("Smart plugs for every appliance, a leak sensor under the sink, and a voice-controlled coffee maker that pairs with your alarm.")
                        .deviceIds("[4,5,6,7,8]")
                        .publicSetup(true)
                        .status(SetupStatus.PUBLISHED)
                        .build(),
                Setup.builder()
                        .user(demo)
                        .name("Bedroom Sleep Sanctuary")
                        .description("Smart curtains, a white-noise hub, a wake-up-light bulb, and a temperature sensor tuned for optimal sleep. Zigbee backbone.")
                        .deviceIds("[9,10,11,12]")
                        .publicSetup(true)
                        .status(SetupStatus.PUBLISHED)
                        .build(),
                Setup.builder()
                        .user(demo)
                        .name("Home Office Productivity Setup")
                        .description("Desk lighting that follows your calendar, a presence sensor that mutes notifications in meetings, and a plug-based coffee maker trigger.")
                        .deviceIds("[13,14,15]")
                        .publicSetup(true)
                        .status(SetupStatus.PUBLISHED)
                        .build(),
                Setup.builder()
                        .user(demo)
                        .name("Outdoor Security Package")
                        .description("Two outdoor cameras, a motion floodlight, and a smart doorbell — all running on a local hub so nothing ever leaves the house.")
                        .deviceIds("[16,17,18,19]")
                        .publicSetup(true)
                        .status(SetupStatus.PUBLISHED)
                        .build()
        );
        setupRepository.saveAll(seeds);
    }

    private void seedArticles(User demo) {
        List<Article> articles = List.of(
                Article.builder()
                        .user(demo)
                        .title("Zigbee vs Z-Wave vs Matter: which should you pick in 2026?")
                        .content("If you are building your first smart home, the protocol you choose decides which devices you can buy for the next five years. Zigbee is the cheapest and most mature, Z-Wave offers the best range, and Matter is the new cross-vendor standard backed by Apple, Google, and Amazon. In practice, most beginners should start with a Matter-capable hub and pick Zigbee devices — that way you get the best of both.\n\nThis guide walks through the trade-offs and lists three compatible starter kits for each protocol.")
                        .deviceIds("[1,2,3]")
                        .build(),
                Article.builder()
                        .user(demo)
                        .title("5 automations every beginner should set up on day one")
                        .content("1) Motion-triggered hallway lighting at night.\n2) Auto-off for the coffee maker after 30 minutes.\n3) Notification when the front door stays open more than 60 seconds.\n4) Sunset-based outdoor light schedule.\n5) A single bedside 'Good night' button that turns off every light in the house.\n\nNone of these require coding. Each one uses a single routine inside your hub's app.")
                        .deviceIds("[2,4]")
                        .build(),
                Article.builder()
                        .user(demo)
                        .title("How I cut my energy bill 22% with $80 of smart plugs")
                        .content("After instrumenting every appliance in the apartment with smart plugs for a month, I found three devices responsible for 40% of the bill — the dehumidifier, the second fridge, and a leaky space heater. I scheduled them, moved the heater's thermostat two degrees lower, and the next month's bill dropped 22%.\n\nThis article breaks down the measurement setup, the data, and the exact automations I used.")
                        .deviceIds("[5,6]")
                        .build(),
                Article.builder()
                        .user(demo)
                        .title("Local-first vs cloud: why your hub choice matters")
                        .content("A cloud-only smart home stops working the moment your internet dies — or the moment a vendor decides to discontinue their service. A local-first hub (Home Assistant, Hubitat, SmartThings with local execution) keeps routines running even when offline, and your data never leaves the house.\n\nThe trade-off is setup time. This article benchmarks three hubs across 10 common routines.")
                        .deviceIds("[7,8,9]")
                        .build()
        );
        articleRepository.saveAll(articles);
    }
}
