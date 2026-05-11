package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class AiLayoutService {

    private final LayoutRepository layoutRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public AiLayoutService(LayoutRepository layoutRepository) {
        this.layoutRepository = layoutRepository;
    }

    /**
     * Metoda principală care iterează prin ID-uri.
     */
    public List<String> extractExistingDeviceNames(List<Integer> layoutIds) {
        List<String> deviceNames = new ArrayList<>();

        for (Integer layoutId : layoutIds) {
            layoutRepository.findById(layoutId).ifPresent(layout ->
                    // Folosim .getDrawing() pentru că așa se numește câmpul în clasa ta Layout
                    processLayoutDrawing(layout.getDrawing(), layoutId, deviceNames)
            );
        }

        return deviceNames;
    }

    /**
     * Metodă extrasă pentru a reduce complexitatea cognitivă (SonarQube fix).
     */
    private void processLayoutDrawing(String drawingJson, Integer layoutId, List<String> deviceNames) {
        if (drawingJson == null || drawingJson.isEmpty()) {
            return;
        }

        try {
            JsonNode root = mapper.readTree(drawingJson);
            JsonNode devices = root.path("devices");

            if (devices.isArray()) {
                for (JsonNode deviceEntry : devices) {
                    // Mergem un nivel mai jos către obiectul "device"
                    collectNamesFromDevice(deviceEntry.path("device"), deviceNames);
                }
            }
        } catch (Exception e) {
            // Înlocuirea System.err cu Logger (SonarQube fix)
            log.error("Error parsing layout JSON for id {}: {}", layoutId, e.getMessage());
        }
    }

    /**
     * Extrage name și deviceType și le adaugă în listă fără duplicate.
     */
    private void collectNamesFromDevice(JsonNode deviceNode, List<String> deviceNames) {
        String name = deviceNode.path("name").asText(null);
        String deviceType = deviceNode.path("deviceType").asText(null);

        if (name != null && !name.trim().isEmpty()) {
            deviceNames.add(name);
        }

        if (deviceType != null && !deviceType.trim().isEmpty() && !deviceNames.contains(deviceType)) {
            deviceNames.add(deviceType);
        }
    }
}