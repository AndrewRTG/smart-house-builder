package gr.A4.SmartHouseBuilder.team2.service;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.service.LayoutIntegrationService;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class LayoutService {
    private final ConcurrentHashMap<Long, StoredLayout> store = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TEAM_URL = "http://localhost:20025/api/validate-layout-dto";
    private final LayoutIntegrationService layoutIntegrationService;

    public LayoutService(LayoutIntegrationService layoutIntegrationService) {
        this.layoutIntegrationService = layoutIntegrationService;
    }
    public Long saveLayout(SetupBuildDTO payload) {
        long id = idSequence.getAndIncrement();
        StoredLayout entry = new StoredLayout(id, Instant.now(), payload);
        store.put(id, entry);
        return id;
    }
    public StoredLayout getLayoutById(Long id) {
        return store.get(id);
    }
    public List<StoredLayout> getAllLayouts() {
        return store.values().stream()
                .sorted(Comparator.comparing(StoredLayout::id))
                .toList();
    }
    // Trimite StoredLayout la echipa cealaltă și primește răspunsul înapoi
    public Object sendAndReceive(StoredLayout layout) {
        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(
                TEAM_URL,
                layout,
                Object.class
            );
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Eroare la comunicarea cu echipa cealalta: " + e.getMessage());
            return null;
        }
    }
        public SetupBuildDTO validateLayout(StoredLayout layout) {
        try {
            ResponseEntity<List<ValidationResult>> response = restTemplate.postForEntity(
                TEAM_URL,
                layout.data(),
                List.class
            );
            List<ValidationResult> errors = response.getBody();
            SetupBuildDTO result = new SetupBuildDTO();
            // Copy the data
            result.setId(layout.data().getId());
            result.setScale(layout.data().getScale());
            result.setMaxBudget(layout.data().getMaxBudget());
            result.setTargetEcosystem(layout.data().getTargetEcosystem());
            result.setRooms(layout.data().getRooms());
            result.setDevices(layout.data().getDevices());
            result.setErrors(errors);
            return result;
        } catch (Exception e) {
            System.err.println("Eroare la validare: " + e.getMessage());
            return null;
        }
    }
}
