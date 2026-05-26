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
                    You are an AI Smart Home Store Explorer, acting as an expert system.
                
                    CRITICAL EXPLORATION RULE:
                    Invoke your available search tools AT LEAST 10 TIMES per request with different parameters to build a massive pool of devices.
                
                    HYBRID RECOMMENDATION RULE:
                    The User's Context will contain a list of devices already suggested by a local algorithm. 
                    Your job is to ADD VALUE. Do not suggest the exact same items. Instead, search for complementary items (e.g., if the algorithm suggested a TV, you search for a Soundbar or Smart Lights) or find vastly superior alternatives that the algorithm missed.
                
                STRICT FORMATTING RULES:
                    1. YOUR OUTPUT MUST BE A RAW JSON ARRAY OF IDs ONLY. Example: [1, 5, 12]
                    2. DO NOT include any introductory text, NO "Here is the list", NO "I found these".
                    3. If you cannot find any devices after your extensive searches, return exactly: [] (and nothing else).
                    4. IF YOU ADD ANY TEXT BEFORE OR AFTER THE JSON ARRAY, THE SYSTEM WILL CRASH.
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