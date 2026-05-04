package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import gr.A4.SmartHouseBuilder.repository.DynamicDeviceRepository;
import gr.A4.SmartHouseBuilder.repository.HardwareDeviceRepository;
import gr.A4.SmartHouseBuilder.tools.DeviceTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class SimpleAiService {

    private final ChatClient chatClient;
    private final HardwareDeviceRepository deviceRepository;
    private final DynamicDeviceRepository dynamicDeviceRepository;
    private final AiLayoutService layoutService;
    private final ObjectMapper mapper = new ObjectMapper();

    public SimpleAiService(ChatClient.Builder chatClientBuilder,
                           DeviceTools deviceTools,
                           HardwareDeviceRepository deviceRepository,
                           DynamicDeviceRepository dynamicDeviceRepository,
                           AiLayoutService layoutService) {
        this.chatClient = chatClientBuilder
                .defaultToolCallbacks(
                        MethodToolCallbackProvider.builder()
                                .toolObjects(deviceTools)
                                .build()
                                .getToolCallbacks()
                )
                .build();
        this.deviceRepository = deviceRepository;
        this.dynamicDeviceRepository = dynamicDeviceRepository;
        this.layoutService = layoutService;
    }

    public String askGemini(String message) {
        return chatClient
                .prompt()
                .system("""
                        You are a smart home assistant for a store.
                        When a user asks about devices, recommendations, or mentions
                        a budget, always call searchDevices or getAllDevices
                        to check what is available before answering.
                        """)
                .user(message)
                .call()
                .content();
    }

    public List<HardwareDevice> getSmartSuggestions(String criteria, List<Integer> layoutIds) {
        try {
            // Step 1: Extract existing devices from layouts
            String existingDevicesSection = "";
            if (layoutIds != null && !layoutIds.isEmpty()) {
                List<String> existingDeviceNames = layoutService.extractExistingDeviceNames(layoutIds);
                if (!existingDeviceNames.isEmpty()) {
                    existingDevicesSection = """

                        The user already has the following devices in their room layouts:
                        %s

                        IMPORTANT:
                        - Do NOT recommend products with the same name as any existing device
                        - Do NOT recommend products that serve the same purpose/type as existing devices
                        - For example if user has a "LIGHT", do not recommend other lights
                        """.formatted(String.join(", ", existingDeviceNames));
                }
            }

            // Step 2: Generate SQL
            String sqlPrompt = """
                    You are a PostgreSQL expert for a Smart Home store database.

                    The table is called 'devices' and has these columns:
                    - id (bigint)
                    - category_id (integer)
                    - name (varchar)
                    - brand (varchar)
                    - description (text)
                    - image_url (varchar)
                    - communication_protocol (varchar)
                    - specifications (jsonb)
                    - price (double precision)
                    - best_price (double precision)
                    - best_price_url (text)
                    - type (varchar)
                    - created_at (timestamp)

                    Category IDs:
                    1  = CAMERE SMART
                    2  = PRELUNGITOARE SMART
                    3  = CONSOLE DE GAMING
                    4  = ELECTROCASNICE SMART
                    5  = HUB-URI SMART
                    6  = MONITOARE SMART
                    7  = PRIZE SMART
                    8  = SENZORI SMART
                    9  = SISTEME AUDIO SMART
                    10 = TELEVIZOARE SMART
                    11 = ASPIRATOARE ROBOT
                    12 = ROUTERE SMART

                    The customer described their preferences:
                    "%s"
                    %s

                    IMPORTANT RULES for generating the query:
                    - "Nivel" (tech level like "Plug & Play", "Intermediate", "Advanced") is NOT a database field — IGNORE IT COMPLETELY
                    - "Oricare" or "Any" means IGNORE that filter entirely
                    - Budget (price <= X) is a hard mandatory filter if mentioned
                    - Categories should use OR between them: category_id IN (1, 8)
                    - "Security" maps to category_id IN (1, 8)
                    - "Comfort" maps to category_id IN (4, 7)
                    - "Energy" maps to category_id IN (2, 7)
                    - "Entertainment" maps to category_id IN (3, 6, 9, 10)

                    Protocol mapping (communication_protocol column):
                    - "Wifi" → communication_protocol ILIKE '%%Wifi%%'
                    - "Zigbee" → communication_protocol ILIKE '%%Zigbee%%'
                    - "Matter" → communication_protocol ILIKE '%%Matter%%'
                    - If protocol is "Oricare" or "Any" → IGNORE this filter
                    - If protocol is specified, it is a HARD filter (AND, not OR)

                    Ecosystem mapping (e.g. "Alexa", "Google Home", "Apple Home"):
                    - Use as a SOFT sort — devices matching ecosystem appear first via CASE WHEN
                    - Search in: specifications::text, name, description
                    - Do NOT exclude devices that don't match ecosystem

                    Always generate the query using this structure:
                    SELECT * FROM devices
                    WHERE <hard filters: price, category_id, communication_protocol>
                    ORDER BY
                      CASE WHEN <ecosystem soft match> THEN 0 ELSE 1 END,
                      price ASC
                    LIMIT 20

                    If no ecosystem or ecosystem is "Oricare", skip CASE WHEN and just ORDER BY price ASC.
                    Return ONLY the raw SQL query, no explanation, no markdown, no backticks.
                    """.formatted(criteria, existingDevicesSection);

            String sql = chatClient
                    .prompt()
                    .user(sqlPrompt)
                    .call()
                    .content()
                    .replace("```sql", "")
                    .replace("```", "")
                    .trim();

            System.out.println("=========================================");
            System.out.println("BEEP BOOP! Am primit următoarele criterii de la Frontend:");
            System.out.println(criteria);
            System.out.println("=========================================");
            System.out.println("Generated SQL: " + sql);

            List<HardwareDevice> devices = dynamicDeviceRepository.executeQuery(sql);
            System.out.println("Found " + devices + " devices");

            return devices;

        } catch (Exception e) {
            System.err.println("AI suggestion error: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}