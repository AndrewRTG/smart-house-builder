package gr.A4.SmartHouseBuilder.scheduler;

import gr.A4.SmartHouseBuilder.service.DeviceImportService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.URL;
import java.util.Map;

@Component
public class AutomatedScraperScheduler {

    private final DeviceImportService deviceImportService;
    @Value("${scraper.feed.url.rovision}")
    private String rovisionUrl;
    @Value("${scraper.feed.url.casesmart}")
    private String caseSmartUrl;
    @Value("${scraper.feed.url.vonmag}")
    private String vonMagUrl;

    public AutomatedScraperScheduler(DeviceImportService deviceImportService) {
        this.deviceImportService = deviceImportService;
    }

    @Scheduled(cron = "0 0 0 */3 * *")
    //@Scheduled(initialDelay = 3000, fixedRate = 30000) //aceasta linie e doar pentru test
    public void runAutomatedScrapers() {
        System.out.println("Scheduler: Automatic download and parsing begins");

        Map<String, String> storeFeeds = Map.of(
                "ROVISION", rovisionUrl,
                "CASESMART", caseSmartUrl,
                "VONMAG", vonMagUrl
        );

        storeFeeds.forEach((storeIdentifier, urlString) -> {
            try {
                System.out.println("Scheduler: I open the data flow for " + storeIdentifier + "...");

                URL url = new URL(urlString);
                try (InputStream xmlStream = url.openStream()) {

                    deviceImportService.importDevicesFromXml(storeIdentifier, xmlStream);

                }
            } catch (Exception e) {
                System.err.println("Error at the shop " + storeIdentifier + ": " + e.getMessage());
            }
        });

        System.out.println("Scheduler: All feeds have been processed.");
    }
}