package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.DeviceSuggestionAlgorithmService;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import gr.A4.SmartHouseBuilder.service.WizardOptimizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class HardwareDeviceController {

    private final WizardOptimizerService wizardOptimizer;
    private final SimpleAiService aiService;
    private final DeviceSuggestionAlgorithmService algorithmService;

    @GetMapping("/suggestions")
    public List<HardwareDevice> getSuggestions(@RequestParam String criteria) {
        return aiService.getSmartSuggestions(criteria);
    }

    @GetMapping("/algorithmSuggestions")
    public List<HardwareDevice> getAlgorithmSuggestions(@RequestParam String criteria) {
        return algorithmService.getSmartSuggestions(criteria);
    }
}