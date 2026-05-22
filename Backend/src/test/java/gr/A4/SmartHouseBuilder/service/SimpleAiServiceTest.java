//package gr.A4.SmartHouseBuilder.service;
//
//import com.fasterxml.jackson.core.JsonProcessingException;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import gr.A4.SmartHouseBuilder.model.HardwareDevice;
//import gr.A4.SmartHouseBuilder.repository.DynamicDeviceRepository;
//import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
//import gr.A4.SmartHouseBuilder.tools.DeviceTools;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.mockito.junit.jupiter.MockitoSettings;
//import org.mockito.quality.Strictness;
//import org.springframework.ai.chat.client.ChatClient;
//import org.springframework.ai.tool.ToolCallback;
//
//import java.util.Collections;
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//@MockitoSettings(strictness = Strictness.LENIENT)
//class SimpleAiServiceTest {
//
//    @Mock
//    private ChatClient.Builder chatClientBuilder;
//    @Mock
//    private HardwareDeviceRepository deviceRepository;
//    @Mock
//    private DynamicDeviceRepository dynamicDeviceRepository;
//    @Mock
//    private AiLayoutService aiLayoutService;
//    @Mock
//    private DeviceTools deviceTools;
//
//    private SimpleAiService simpleAiService;
//    private ChatClient chatClientMock;
//    private final ObjectMapper realMapper = new ObjectMapper();
//
//    @BeforeEach
//    void setUp() {
//        chatClientMock = mock(ChatClient.class, RETURNS_DEEP_STUBS);
//        doReturn(chatClientBuilder).when(chatClientBuilder).defaultToolCallbacks(any(ToolCallback[].class));
//        doReturn(chatClientMock).when(chatClientBuilder).build();
//
//        simpleAiService = new SimpleAiService(
//                chatClientBuilder,
//                deviceTools,
//                deviceRepository,
//                dynamicDeviceRepository,
//                aiLayoutService
//        );
//    }
//
//    @Test
//    void testAskGemini_Success() {
//        when(chatClientMock.prompt().system(anyString()).user(anyString()).call().content())
//                .thenReturn("Hello World");
//
//        String result = simpleAiService.askGemini("Bună");
//        assertEquals("Hello World", result);
//    }
//
//    @Test
//    void testAskGemini_NullResponse() {
//        when(chatClientMock.prompt().system(anyString()).user(anyString()).call().content())
//                .thenReturn(null);
//
//        String result = simpleAiService.askGemini("Bună");
//        assertEquals("", result);
//    }
//
//    @Test
//    void testGetSmartSuggestions_FullFlow() throws JsonProcessingException {
//        // GIVEN
//        List<Integer> layoutIds = List.of(1);
//        when(aiLayoutService.extractExistingDeviceNames(layoutIds)).thenReturn(List.of("Existing Light"));
//
//        // Primul apel AI (generare SQL)
//        when(chatClientMock.prompt().user(contains("SELECT * FROM devices")).call().content())
//                .thenReturn("```sql SELECT * FROM devices WHERE price <= 500 ```");
//
//        // Rezultate baza de date
//        HardwareDevice dev = new HardwareDevice();
//        dev.setId(1L);
//        dev.setName("Test Device");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(List.of(dev));
//
//        // Al doilea apel AI (filtrare ID-uri JSON)
//        when(chatClientMock.prompt().user(contains("JSON array of integer IDs")).call().content())
//                .thenReturn("```json [1] ```");
//
//        when(deviceRepository.findAllById(anyList())).thenReturn(List.of(dev));
//
//        // WHEN
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("buget 500", layoutIds);
//
//        // THEN
//        assertFalse(result.isEmpty());
//        assertEquals("Test Device", result.get(0).getName());
//    }
//
//    @Test
//    void testGetSmartSuggestions_AiReturnsInvalidJsonForIds() {
//        // GIVEN: Primul apel (SQL) merge, dar al doilea (ID-uri) returnează text invalid
//        when(chatClientMock.prompt().user(contains("SELECT * FROM devices")).call().content())
//                .thenReturn("SELECT * FROM devices");
//
//        HardwareDevice dev = new HardwareDevice();
//        dev.setId(1L);
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(List.of(dev));
//
//        // AI returnează ceva ce nu este un JSON valid de tip List<Long>
//        when(chatClientMock.prompt().user(contains("JSON array of integer IDs")).call().content())
//                .thenReturn("Nu vreau să îți dau ID-uri acum.");
//
//        // WHEN
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", null);
//
//        // THEN: Ar trebui să prindă eroarea în catch și să returneze listă goală
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    void testGetSmartSuggestions_LayoutIdsIsNotEmptyButServiceReturnsEmpty() {
//        // 1. GIVEN: layoutIds nu e null, are un ID, dar layoutService returnează listă goală
//        // Aceasta forțează ramura FALSE de la: if (!existingDeviceNames.isEmpty())
//        List<Integer> ids = List.of(99);
//        when(aiLayoutService.extractExistingDeviceNames(ids)).thenReturn(Collections.emptyList());
//
//        // Simulăm restul să meargă până la capăt
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn("SELECT * FROM devices");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(Collections.emptyList());
//
//        // 2. WHEN
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", ids);
//
//        // 3. THEN
//        assertTrue(result.isEmpty());
//        // Verificăm că am intrat în if-ul principal dar am sărit peste formarea string-ului
//        verify(aiLayoutService).extractExistingDeviceNames(ids);
//    }
//
//    @Test
//    void testGetSmartSuggestions_BranchCoverage_LayoutConditions() {
//        // RAMURA: layoutIds este NOT NULL, dar este EMPTY list
//        // Aceasta forțează a doua parte a condiției (&& !layoutIds.isEmpty()) să fie FALSE
//        List<Integer> emptyList = Collections.emptyList();
//
//        // Setup minim pentru ca metoda să nu crape mai jos
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn("SELECT * FROM devices");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(Collections.emptyList());
//
//        // Executăm cu listă goală
//        simpleAiService.getSmartSuggestions("criteria", emptyList);
//
//        // Verificăm că layoutService NU a fost apelat (pentru că s-a oprit la !layoutIds.isEmpty())
//        verify(aiLayoutService, never()).extractExistingDeviceNames(anyList());
//    }
//
//    @Test
//    void testGetSmartSuggestions_BranchCoverage_ExistingNamesEmpty() {
//        // RAMURA: layoutIds este valid, dar extractExistingDeviceNames returnează listă GOALĂ
//        // Aceasta forțează ramura FALSE a if-ului: if (!existingDeviceNames.isEmpty())
//        List<Integer> validIds = List.of(1, 2);
//        when(aiLayoutService.extractExistingDeviceNames(validIds)).thenReturn(Collections.emptyList());
//
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn("SELECT * FROM devices");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(Collections.emptyList());
//
//        // Executăm
//        simpleAiService.getSmartSuggestions("criteria", validIds);
//
//        // Verificăm că s-a apelat serviciul, dar string-ul final nu va conține "The user already has..."
//        verify(aiLayoutService).extractExistingDeviceNames(validIds);
//    }
//
//    @Test
//    void testGetSmartSuggestions_LayoutIdsNull() {
//        // GIVEN: layoutIds este null
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn("SELECT...");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(Collections.emptyList());
//
//        // WHEN
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", null);
//
//        // THEN: Verificăm că layoutService NU a fost apelat
//        verifyNoInteractions(aiLayoutService);
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    void testGetSmartSuggestions_AiReturnsNullSql() {
//        // GIVEN: AI returnează null la primul prompt
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn(null);
//
//        // WHEN
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", null);
//
//        // THEN: sql va fi "", dynamicDeviceRepository va fi apelat cu "" și probabil va returna empty
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    void testGetSmartSuggestions_NoCandidatesFound() {
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn("SELECT...");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(Collections.emptyList());
//
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", null);
//
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    void testGetSmartSuggestions_ExceptionHandling() {
//        // Forțăm o excepție în timpul execuției (ex: AI returnează ceva ce crapă la replace)
//        when(chatClientMock.prompt().user(anyString())).thenThrow(new RuntimeException("AI Error"));
//
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", null);
//
//        // Ar trebui să intre în catch și să returneze listă goală
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    void testGetSmartSuggestions_ExistingDevicesEmpty() {
//        // Testăm ramura unde layoutService returnează listă goală
//        when(aiLayoutService.extractExistingDeviceNames(anyList())).thenReturn(Collections.emptyList());
//        when(chatClientMock.prompt().user(anyString()).call().content()).thenReturn("SELECT...");
//        when(dynamicDeviceRepository.executeQuery(anyString())).thenReturn(Collections.emptyList());
//
//        List<HardwareDevice> result = simpleAiService.getSmartSuggestions("test", List.of(1));
//        assertTrue(result.isEmpty());
//    }
//}