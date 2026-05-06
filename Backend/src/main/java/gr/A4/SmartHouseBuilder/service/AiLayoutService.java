package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiLayoutService {

    private final LayoutRepository layoutRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public AiLayoutService(LayoutRepository layoutRepository) {
        this.layoutRepository = layoutRepository;
    }

    public List<String> extractExistingDeviceNames(List<Integer> layoutIds) {
        List<String> deviceNames = new ArrayList<>();

        for (Integer layoutId : layoutIds) {
            layoutRepository.findById(layoutId).ifPresent(layout -> {
                try {
                    JsonNode root = mapper.readTree(layout.getDrawing());
                    JsonNode devices = root.path("devices");

                    if (devices.isArray()) {
                        for (JsonNode deviceEntry : devices) {
                            JsonNode device = deviceEntry.path("device");

                            String name = device.path("name").asText(null);
                            String deviceType = device.path("deviceType").asText(null);

                            if (name != null) {
                                deviceNames.add(name);
                            }
                            if (deviceType != null && !deviceNames.contains(deviceType)) {
                                deviceNames.add(deviceType);
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error parsing layout JSON for id " + layoutId + ": " + e.getMessage());
                }
            });
        }

        return deviceNames;
    }
}
