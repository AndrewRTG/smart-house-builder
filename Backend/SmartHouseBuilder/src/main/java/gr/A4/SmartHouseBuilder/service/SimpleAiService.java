package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.core.type.TypeReference; // <-- Importul corectat
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class SimpleAiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // 1. Am mutat ObjectMapper aici sus ca să poată fi folosit de ambele metode
    private final ObjectMapper mapper = new ObjectMapper();

    // 2. Am adăugat conexiunea cu baza de date
    private final HardwareDeviceRepository deviceRepository;

    // 3. Constructorul pentru a injecta repository-ul corect
    public SimpleAiService(HardwareDeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public String askGemini(String message) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", message)
                        ))
                )
        );

        try {
            String rawResponse = restTemplate.postForObject(url, requestBody, String.class);
            JsonNode responseNode = mapper.readTree(rawResponse);

            if (responseNode != null && responseNode.has("candidates")) {
                return responseNode.at("/candidates/0/content/parts/0/text").asText();
            }

            return "Nu am primit un răspuns valid de la AI.";

        } catch (Exception e) {
            return "Eroare la apelul AI: " + e.getMessage();
        }
    }

    public List<HardwareDevice> getSmartSuggestions(String criteria) {
        try {
            // Folosim deviceRepository (așa cum l-am denumit mai sus)
            List<HardwareDevice> allDevices = deviceRepository.findAll();

            String devicesJson = mapper.writeValueAsString(allDevices);

            String strictPrompt = "Ești un asistent backend pentru un magazin Smart Home. \n" +
                    "Aici este catalogul nostru de produse în format JSON:\n" + devicesJson + "\n\n" +
                    "Criteriile clientului sunt: " + criteria + "\n\n" +
                    "SARCINĂ: Alege cele mai bune produse care se încadrează în criterii și buget. " +
                    "Trebuie să returnezi STRICT un array JSON care conține doar ID-urile (numere întregi) ale produselor alese. " +
                    "FĂRĂ text suplimentar, FĂRĂ explicații, FĂRĂ formatare markdown (fără ```json). Doar array-ul, de exemplu: [1, 4, 7]";

            // 4. Am curățat string-ul URL-ului (am scos parantezele pătrate adăugate din greșeală la copy-paste)
            // VARIANTA CORECTĂ:
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", strictPrompt)
                            ))
                    )
            );

            String rawResponse = restTemplate.postForObject(url, requestBody, String.class);
            JsonNode responseNode = mapper.readTree(rawResponse);

            if (responseNode != null && responseNode.has("candidates")) {
                String aiText = responseNode.at("/candidates/0/content/parts/0/text").asText();

                String cleanJson = aiText.replace("```json", "").replace("```", "").trim();
                System.out.println("Gemini a returnat ID-urile: " + cleanJson);

                List<Long> recommendedIds = mapper.readValue(cleanJson, new TypeReference<List<Long>>() {});

                return deviceRepository.findAllById(recommendedIds);
            }

            return Collections.emptyList();

        } catch (Exception e) {
            System.err.println("Eroare la parsarea AI: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}