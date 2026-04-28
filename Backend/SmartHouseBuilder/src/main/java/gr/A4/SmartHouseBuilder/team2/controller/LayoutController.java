package gr.A4.SmartHouseBuilder.team2.controller;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.service.LayoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/team2/layouts")
public class LayoutController {
    
    private final LayoutService layoutService;

    public LayoutController(LayoutService layoutService) {
        this.layoutService = layoutService;
    }

    @PostMapping("/validate")
    public ResponseEntity<SetupBuildDTO> validateLayout(@RequestBody SetupBuildDTO data) {
        Long id = layoutService.saveLayout(data);
        
        StoredLayout layout = layoutService.getLayoutById(id);

        SetupBuildDTO raspunsValidat = layoutService.validateLayout(layout);
        
        return ResponseEntity.ok(raspunsValidat);
    }

}