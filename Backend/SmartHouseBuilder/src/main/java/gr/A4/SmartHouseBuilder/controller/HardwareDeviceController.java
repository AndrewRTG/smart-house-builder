package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import gr.A4.SmartHouseBuilder.service.WizardOptimizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class HardwareDeviceController {

    private final WizardOptimizerService wizardOptimizer;
    private final SimpleAiService aiService;

    @GetMapping("/suggestions")
    public List<HardwareDevice> getSuggestions(@RequestParam String criteria) {

        String request = criteria;
        List<Integer> layoutIds = new ArrayList<>();

        if (criteria.contains("Rooms:")) {
            String[] parts = criteria.split("Rooms:");
            request = parts[0].trim();
            String roomsPart = parts[1].trim();
            for (String id : roomsPart.split(",")) {
                try {
                    layoutIds.add(Integer.parseInt(id.trim()));
                } catch (NumberFormatException e) {
                    System.err.println("Could not parse room ID: " + id);
                }
            }
        }

        return aiService.getSmartSuggestions(request, layoutIds);
    }
}