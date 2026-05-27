package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import gr.A4.SmartHouseBuilder.tools.DeviceTools;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class SimpleAiService {

    private final ChatClient chatClient;
    private final HardwareDeviceRepository deviceRepository;
    private final ObjectMapper mapper = new ObjectMapper();
    private final DeviceTools deviceTools;

    // Memoria manuală pentru a reține conversațiile
    private final List<Message> history = new ArrayList<>();

    public SimpleAiService(ChatClient.Builder chatClientBuilder,
                           HardwareDeviceRepository deviceRepository,
                           DeviceTools deviceTools) {
        this.chatClient = chatClientBuilder.build();
        this.deviceRepository = deviceRepository;
        this.deviceTools = deviceTools;
    }

    public List<HardwareDevice> searchWithAgent(String userMessage, String existingContext) {
        // 1. Gestionarea memoriei (Adăugăm ce a cerut user-ul)
        history.add(new UserMessage(userMessage));
        if (history.size() > 10) history.remove(0); // Limităm la 10 mesaje

        // 2. Apelăm agentul pentru căutarea exploratorie (multi-tool)
        String cleanJson = performExploratorySearch(existingContext);

        // 3. Salvăm răspunsul final al AI-ului în istoric
        history.add(new AssistantMessage(cleanJson));

        // 4. Procesarea sigură a rezultatelor
        if (cleanJson.equals("[]") || cleanJson.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            List<Long> deviceIds = mapper.readValue(cleanJson, new TypeReference<List<Long>>() {
            });

            // Preluăm produsele din DB și eliminăm duplicatele (distinct)
            return deviceRepository.findAllById(deviceIds.stream().distinct().toList());
        } catch (Exception e) {
            log.error("Eroare la parsarea JSON-ului AI-ului: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // Metoda extrasă pentru a reduce "Cognitive Complexity" din SonarLint
    private String performExploratorySearch(String existingContext) {
        String systemPrompt = """
                You are an AI Smart Home Store Assistant. Your job is to find the best devices using your search tools.
                
                HOW TO CHOOSE WHAT TO SEARCH FOR:
                1. If the user asks for something specific (e.g., "I want a TV", "recomandă un televizor"), YOU MUST SEARCH FOR THAT EXACT ITEM. Ignore everything else and find what they want.
                2. If the user asks a general question (e.g., "what else do I need?"), look at the 'Already Suggested Devices' in the Context and search for accessories or complementary items (e.g., if they have a TV, search for a soundbar or LED strip).
                
                DEVICE TYPE LEGEND (Crucial for understanding what to search for):
                1: Camera, 2: Power Strip, 3: Gaming Console, 4: Smart Appliance, 5: Hub,\s
                6: Monitor, 7: Smart Outlet, 8: Smart Sensor, 9: Audio System, 10: Smart TV,\s
                11: Robot Vacuum, 12: Router, 13: Light bulb.
                SEARCH INSTRUCTIONS:
                - Call your search tools multiple times (3 to 5 times) to gather a few good options.
                - Try to respect the User's Budget and Ecosystem if possible.
                
                OUTPUT INSTRUCTIONS:
                - You must output ONLY a valid JSON array of the device IDs.
                - Example: [10, 24, 7]
                - Return [] if you really can't find anything.
                - DO NOT output any other words, no greetings, no markdown. Just the array.
                """;

        if (existingContext != null && !existingContext.trim().isEmpty()) {
            systemPrompt += "\n\nCONTEXT (User History/Preferences): " + existingContext;
        }

        try {
            // Trimitem apelul către model. Spring AI / OpenAI va detecta automat
            // necesitatea de "Parallel Tool Calling" datorită promptului puternic.
            String aiResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .messages(history)
                    .tools(deviceTools)
                    .call()
                    .content();

            return aiResponse.replace("```json", "").replace("```", "").trim();
        } catch (Exception e) {
            log.error("AI Agent Tool Call Error: {}", e.getMessage());
            return "[]";
        }
    }

    public String askGemini(String message) {
        return Optional.ofNullable(
                chatClient.prompt()
                        .system("You are a smart home assistant. Always check available devices.")
                        .user(message)
                        .call()
                        .content()
        ).orElse("");
    }
}