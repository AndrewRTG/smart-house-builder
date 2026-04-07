package gr.A4.SmartHouseBuilder.controller;



import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.service.LayoutIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LayoutValidationController {

    private final LayoutIntegrationService integrationService;

    public LayoutValidationController(LayoutIntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @PostMapping("/validate-layout")
    public ResponseEntity<List<ValidationResult>> validateLayout(@Valid @RequestBody SetupBuild payload) {
        // Dacă e corupt sau lipsesc câmpuri obligatorii, Spring oprește automat execuția aici.

        // Dacă ajunge aici, fisierul este VALID.
        // Îl pasăm serviciului pentru integrare.
        List<ValidationResult> results = integrationService.integrateAndVerify(payload);

        return ResponseEntity.ok(results);
    }
}