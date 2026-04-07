package gr.A4.SmartHouseBuilder.team2.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.service.LayoutService;
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

    public LayoutController(LayoutService layoutService) {
        this.layoutService = layoutService;
    }

    // Salvează layout-ul primit de la frontend
    @PostMapping("/save")
    public ResponseEntity<String> saveLayout(@RequestBody SetupBuildDTO data) {
        Long id = layoutService.saveLayout(data);
        return ResponseEntity.ok("OK" + id);
    }

    // Salvează layout-ul, îl trimite la echipa cealaltă și returnează răspunsul lor
    @PostMapping("/send")
    public ResponseEntity<Object> sendLayout(@RequestBody SetupBuildDTO data) {
        Long id = layoutService.saveLayout(data);
        StoredLayout layout = layoutService.getLayoutById(id);
        Object raspuns = layoutService.sendAndReceive(layout);
        return ResponseEntity.ok(raspuns);
    }

    // Returnează toate layout-urile salvate ca JSON
    @GetMapping("/all")
    public ResponseEntity<List<StoredLayout>> getAllLayouts() {
        return ResponseEntity.ok(layoutService.getAllLayouts());
    }

    // Returnează toate layout-urile ca pagină HTML vizuală
    @GetMapping(value = "/view", produces = MediaType.TEXT_HTML_VALUE)
    public String viewLayoutsAsHtml() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String json = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(layoutService.getAllLayouts());
        String escaped = HtmlUtils.htmlEscape(json);
        return """
                <!DOCTYPE html>
                <html lang="ro">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Layouturi în memorie</title>
                <style>
                  body { font-family: ui-monospace, Consolas, monospace; margin: 1rem; background: #1a1a1e; color: #e8e8e8; }
                  h1 { font-size: 1.1rem; font-weight: 600; }
                  p { color: #888; font-size: 12px; }
                  pre { white-space: pre-wrap; word-break: break-word; background: #111; padding: 1rem; border-radius: 8px; border: 1px solid #333; }
                </style>
                </head>
                <body>
                <h1>StoredLayout[] — JSON din memorie</h1>
                <p>Endpoint: <code>GET /api/team2/layouts/view</code></p>
                <pre>%s</pre>
                </body>
                </html>
                """.formatted(escaped);
    }
    @PostMapping("/validate")
public ResponseEntity<SetupBuildDTO> validateLayout(@RequestBody SetupBuildDTO data) {
    Long id = layoutService.saveLayout(data);
    StoredLayout layout = layoutService.getLayoutById(id);
    SetupBuildDTO raspuns = layoutService.validateLayout(layout);
    return ResponseEntity.ok(raspuns);
}
}
