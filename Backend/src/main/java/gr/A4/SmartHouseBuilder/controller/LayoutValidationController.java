package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import gr.A4.SmartHouseBuilder.service.LayoutIntegrationService;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LayoutValidationController {

    private final LayoutIntegrationService integrationService;

    public LayoutValidationController(LayoutIntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @PostMapping("/validate-layout")
    public ResponseEntity<List<ValidationResult>> validateLayout(@Valid @RequestBody SetupBuild payload) {
        List<ValidationResult> results = integrationService.integrateAndVerify(payload);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/validate-layout-dto")
    public ResponseEntity<List<ValidationResult>> validateLayoutDTO(@RequestBody SetupBuildDTO payload) {
        SetupBuild build = convertDTOToSetupBuild(payload);
        List<ValidationResult> results = integrationService.integrateAndVerify(build);
        return ResponseEntity.ok(results);
    }

    private SetupBuild convertDTOToSetupBuild(SetupBuildDTO dto) {
        SetupBuild build = new SetupBuild();
        build.setId(dto.getId());
        build.setScale(dto.getScale());
        build.setMaxBudget(dto.getMaxBudget());
        build.setTargetEcosystem(dto.getTargetEcosystem());
        build.setRooms((List) dto.getRooms());
        build.setDevices((List) dto.getDevices());
        return build;
    }
}
