package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HouseConfiguration;
import gr.A4.SmartHouseBuilder.dto.HouseConfigurationRequest;
import gr.A4.SmartHouseBuilder.service.HouseConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/house-configurations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HouseConfigurationController {

    private final HouseConfigurationService service;

    @PostMapping
    public ResponseEntity<HouseConfiguration> createHouseConfiguration(@RequestBody HouseConfigurationRequest request) {
        try {
            HouseConfiguration saved = service.saveHouseConfiguration(request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<HouseConfiguration>> getAllConfigurations() {
        return ResponseEntity.ok(service.getAllConfigurations());
    }
}