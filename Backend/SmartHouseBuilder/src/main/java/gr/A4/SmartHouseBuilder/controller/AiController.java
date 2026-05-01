package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.service.SimpleAiService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@AllArgsConstructor
public class AiController {

    private final SimpleAiService aiService;

    // Endpoint de test pe care îl poți apela din Postman sau Browser
    @GetMapping("/test")
    public String testGemini(@RequestParam String message) {
        return aiService.askGemini(message);
    }

}