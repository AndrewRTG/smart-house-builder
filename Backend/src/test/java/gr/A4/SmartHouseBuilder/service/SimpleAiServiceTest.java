package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import gr.A4.SmartHouseBuilder.tools.DeviceTools;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimpleAiServiceTest {

    @Mock
    private HardwareDeviceRepository deviceRepository;

    @Mock
    private DeviceTools deviceTools;

    @Mock
    private ChatClient.Builder chatClientBuilder;

    // Mock-uri pentru Fluent API
    @Mock
    private ChatClient chatClient;
    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;
    @Mock
    private ChatClient.CallResponseSpec responseSpec;

    private SimpleAiService aiService;

    @BeforeEach
    void setUp() {
        when(chatClientBuilder.build()).thenReturn(chatClient);

        // Permitem orice apel din lanțul ChatClient să returneze mock-urile noastre
        lenient().when(chatClient.prompt()).thenReturn(requestSpec);
        lenient().when(requestSpec.system(anyString())).thenReturn(requestSpec);
        lenient().when(requestSpec.user(anyString())).thenReturn(requestSpec);
        lenient().when(requestSpec.messages(anyList())).thenReturn(requestSpec);
        lenient().when(requestSpec.tools((Object) any())).thenReturn(requestSpec);
        lenient().when(requestSpec.tools((Object[]) any())).thenReturn(requestSpec);
        lenient().when(requestSpec.call()).thenReturn(responseSpec);

        aiService = new SimpleAiService(chatClientBuilder, deviceRepository, deviceTools);
    }

    // =========================================================================
    // TESTE PENTRU askGemini()
    // =========================================================================

    @Test
    void askGemini_ReturnsExpectedString() {
        when(responseSpec.content()).thenReturn("Răspuns valid");
        assertEquals("Răspuns valid", aiService.askGemini("Salut"));
    }

    @Test
    void askGemini_ReturnsEmptyString_WhenApiReturnsNull() {
        // Acoperă ramura Optional.orElse("")
        when(responseSpec.content()).thenReturn(null);
        assertEquals("", aiService.askGemini("Salut"));
    }

    // =========================================================================
    // TESTE PENTRU searchWithAgent() și logica de procesare
    // =========================================================================

    @Test
    void searchWithAgent_ValidJson_ReturnsDevices() {
        when(responseSpec.content()).thenReturn("[1, 2]");
        HardwareDevice d1 = new HardwareDevice(); d1.setId(1L);
        HardwareDevice d2 = new HardwareDevice(); d2.setId(2L);

        when(deviceRepository.findAllById(anyList())).thenReturn(List.of(d1, d2));

        List<HardwareDevice> result = aiService.searchWithAgent("Vreau prize", "context");

        assertEquals(2, result.size());
        verify(deviceRepository, times(1)).findAllById(anyList());
    }

    @Test
    void searchWithAgent_WithMarkdownFormatting_CleansJsonAndReturnsDevices() {
        // Acoperă `.replace("```json", "").replace("```", "").trim()`
        when(responseSpec.content()).thenReturn("```json\n[5]\n```");
        HardwareDevice d1 = new HardwareDevice(); d1.setId(5L);

        when(deviceRepository.findAllById(anyList())).thenReturn(List.of(d1));

        List<HardwareDevice> result = aiService.searchWithAgent("Dă-mi un TV", null);

        assertEquals(1, result.size());
        verify(deviceRepository, times(1)).findAllById(anyList());
    }

    @Test
    void searchWithAgent_EmptyArrayString_ReturnsEmptyList() {
        // Acoperă condiția `cleanJson.equals("[]")`
        when(responseSpec.content()).thenReturn("[]");

        List<HardwareDevice> result = aiService.searchWithAgent("Ceva inexistent", null);

        assertTrue(result.isEmpty());
        verifyNoInteractions(deviceRepository);
    }

    @Test
    void searchWithAgent_EmptyString_ReturnsEmptyList() {
        // Acoperă condiția `cleanJson.isEmpty()`
        when(responseSpec.content()).thenReturn("   "); // .trim() îl va face empty

        List<HardwareDevice> result = aiService.searchWithAgent("Ignoră", null);

        assertTrue(result.isEmpty());
        verifyNoInteractions(deviceRepository);
    }

    // =========================================================================
    // TESTE PENTRU Context și Istoric (Branch Coverage avansat)
    // =========================================================================

    @Test
    void searchWithAgent_WithNullOrBlankContext_IgnoresContext() {
        when(responseSpec.content()).thenReturn("[]");

        // Testăm ambele variante care trebuie ignorate
        aiService.searchWithAgent("Mesaj", null);
        aiService.searchWithAgent("Mesaj", "   ");

        // Verificăm că a trecut fără erori
        verify(chatClient, times(2)).prompt();
    }

    @Test
    void searchWithAgent_ExceedsHistoryLimit_MaintainsSizeAndDoesNotCrash() {
        when(responseSpec.content()).thenReturn("[]");

        // Rulăm metoda de 12 ori pentru a forța intrarea în `if`-ul care șterge istoricul vechi
        for (int i = 0; i < 12; i++) {
            aiService.searchWithAgent("Mesaj " + i, null);
        }

        // Verificăm că ChatClient-ul a fost apelat de 12 ori fără să dea crash
        verify(chatClient, times(12)).prompt();
    }

    // =========================================================================
    // TESTE PENTRU Excepții (try-catch branches)
    // =========================================================================

    @Test
    void searchWithAgent_ChatClientThrowsException_CaughtAndReturnsEmptyList() {
        // Acoperă blocul catch din `performExploratorySearch`
        when(requestSpec.call()).thenThrow(new RuntimeException("Eroare de la Spring AI / OpenAI"));

        List<HardwareDevice> result = aiService.searchWithAgent("Orice", null);

        // Dacă prinde eroarea, `performExploratorySearch` returnează "[]"
        // Iar `searchWithAgent` interpretează "[]" ca listă goală
        assertTrue(result.isEmpty());
        verifyNoInteractions(deviceRepository);
    }

    @Test
    void searchWithAgent_MalformedJson_ThrowsExceptionAndReturnsEmptyList() {
        // Acoperă blocul catch din `searchWithAgent` (când parsarea JSON crapă)
        when(responseSpec.content()).thenReturn("Acesta nu este un JSON valid");

        List<HardwareDevice> result = aiService.searchWithAgent("Test eroare parsare", null);

        assertTrue(result.isEmpty());
        // Verificăm că baza de date nu a fost apelată cu date greșite
        verifyNoInteractions(deviceRepository);
    }
}