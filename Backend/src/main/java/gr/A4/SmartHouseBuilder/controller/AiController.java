package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@AllArgsConstructor
public class AiController {

    private final SimpleAiService aiService;

    // Metoda ta veche (o păstrăm ca să nu stricăm altceva)
    @GetMapping("/test")
    public String testGemini(@RequestParam String message) {
        return aiService.askGemini(message);
    }

    // NOU: Metoda pe care o strigă frontend-ul din SetupWizard
    @PostMapping("/agent-search")
    public ResponseEntity<?> performAgenticSearch(@RequestBody Map<String, String> requestBody) {
        try {
            String userPrompt = requestBody.get("prompt");
            String context = requestBody.get("context");

            if (userPrompt == null || userPrompt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Prompt-ul nu poate fi gol."));
            }

            // Returnăm direct lista de produse
            List<HardwareDevice> suggestedDevices = aiService.searchWithAgent(userPrompt, context);

            // Frontend-ul va primi un obiect JSON cu cheia "devices"
            return ResponseEntity.ok(Map.of("devices", suggestedDevices));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Eroare la procesarea AI: " + e.getMessage()));
        }
    }
}