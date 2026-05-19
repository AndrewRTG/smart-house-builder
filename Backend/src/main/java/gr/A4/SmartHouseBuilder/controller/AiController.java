package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

            if (userPrompt == null || userPrompt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Prompt-ul nu poate fi gol."));
            }

            // Apelează agentul creat anterior
            String agentResponse = aiService.searchWithAgent(userPrompt);

            // Returnează rezultatul către frontend (format JSON)
            return ResponseEntity.ok(Map.of("response", agentResponse));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Eroare la procesarea AI: " + e.getMessage()));
        }
    }
}