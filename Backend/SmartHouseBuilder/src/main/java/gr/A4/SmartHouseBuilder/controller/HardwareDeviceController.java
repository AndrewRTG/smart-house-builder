package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.WizardOptimizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class HardwareDeviceController {

    private final WizardOptimizerService wizardOptimizer;

    @GetMapping("/suggestions")
    public ResponseEntity<List<HardwareDevice>> getSuggestions() {
        List<HardwareDevice> suggestions = wizardOptimizer.getDeviceSuggestions();

        return ResponseEntity.ok(suggestions);
    }
}