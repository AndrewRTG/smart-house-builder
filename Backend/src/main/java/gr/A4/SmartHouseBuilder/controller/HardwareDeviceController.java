package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.DeviceSuggestionAlgorithmService;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import gr.A4.SmartHouseBuilder.service.WizardOptimizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class HardwareDeviceController {

    private final WizardOptimizerService wizardOptimizer;
    private final SimpleAiService aiService;
    private final DeviceSuggestionAlgorithmService algorithmService;


    @GetMapping("/algorithmSuggestions")
    public List<HardwareDevice> getAlgorithmSuggestions(@RequestParam String criteria) {
        return algorithmService.getSmartSuggestions(criteria);
    }
}
