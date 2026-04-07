package gr.A4.SmartHouseBuilder.team2.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.service.LayoutService;
import gr.A4.SmartHouseBuilder.service.LayoutIntegrationService; // Importul serviciului tau
import gr.A4.SmartHouseBuilder.model.ValidationResult; // Importul modelului tau de erori
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/team2/layouts")
public class LayoutController {

    private final LayoutService layoutService;
    private final ObjectMapper objectMapper;
    private final LayoutIntegrationService validationService; // Aici am adaugat serviciul tau!

    // Am actualizat constructorul pentru a include serviciul tau
    public LayoutController(LayoutService layoutService, ObjectMapper objectMapper, LayoutIntegrationService validationService) {
        this.layoutService = layoutService;
        this.objectMapper = objectMapper;
        this.validationService = validationService;
    }

    @PostMapping("/save")
    public ResponseEntity<String> saveLayout(@RequestBody SetupBuildDTO data) {
        Long id = layoutService.saveLayout(data);
        return ResponseEntity.ok("OK" + id);
    }

    @PostMapping("/send")
    public ResponseEntity<Object> sendLayout(@RequestBody SetupBuildDTO data) {
        Long id = layoutService.saveLayout(data);
        StoredLayout layout = layoutService.getLayoutById(id);
        Object raspuns = layoutService.sendAndReceive(layout);
        return ResponseEntity.ok(raspuns);
    }

    @GetMapping("/all")
    public ResponseEntity<List<StoredLayout>> getAllLayouts() {
        return ResponseEntity.ok(layoutService.getAllLayouts());
    }

    @GetMapping(value = "/view", produces = MediaType.TEXT_HTML_VALUE)
    public String viewLayoutsAsHtml() throws JsonProcessingException {
        String json = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(layoutService.getAllLayouts());
        String escaped = HtmlUtils.htmlEscape(json);
        return """
                <!DOCTYPE html>
                <html lang="ro">
                <head>
                <meta charset="UTF-8">
                <title>Layouturi în memorie</title>
                </head>
                <body>
                <pre>%s</pre>
                </body>
                </html>
                """.formatted(escaped);
    }

    // ASTA ESTE ENDPOINT-UL MODIFICAT CARE FOLOSESTE MOTORUL TAU
    @PostMapping("/validate")
    public ResponseEntity<List<ValidationResult>> validateLayout(@RequestBody SetupBuildDTO data) {
        // Trimitem "data" (care e SetupBuildDTO) la metoda verifyTeam2Layout din serviciul tau
        List<ValidationResult> raspuns = validationService.verifyTeam2Layout(data);
        return ResponseEntity.ok(raspuns);
    }
}