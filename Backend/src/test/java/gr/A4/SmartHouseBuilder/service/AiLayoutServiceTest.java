package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.Layout;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiLayoutServiceTest {

    @Mock
    private LayoutRepository layoutRepository;

    @InjectMocks
    private AiLayoutService aiLayoutService;

    @Test
    void testFullCoverage_AllBranches() {
        // 1. Pregătim un JSON complex care atinge multiple ramuri:
        // - Primul device: are nume și tip (ramuri True)
        // - Al doilea device: are nume null, dar tip valid (ramură False la name, True la type)
        // - Al treilea device: are nume valid, dar tip care DEJA există (ramură False la !contains)
        String json = """
            {
              "devices": [
                { "device": { "name": "Lumina1", "deviceType": "Bec" } },
                { "device": { "name": null, "deviceType": "Senzor" } },
                { "device": { "name": "Lumina2", "deviceType": "Bec" } }
              ]
            }
            """;

        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(1);

        // Executăm
        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(1));

        // Verificăm: "Bec" trebuie să apară o singură dată deși e de 2 ori în JSON (testăm !contains)
        assertEquals(4, result.size()); // "Lumina1", "Bec", "Lumina2" (Senzor e acolo, name null e sărit)
        assertTrue(result.contains("Lumina1"));
        assertTrue(result.contains("Bec"));
        assertTrue(result.contains("Senzor"));
        assertTrue(result.contains("Lumina2"));
    }

    @Test
    void testCollectNamesFromDevice_DeviceTypeNull() {
        // Forțăm ramura: deviceType == null (A is False)
        String json = "{\"devices\": [{\"device\": {\"name\": \"Boxa\", \"deviceType\": null}}]}";
        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(60);
        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(60));

        assertEquals(1, result.size());
        assertTrue(result.contains("Boxa"));
    }

    @Test
    void testCollectNamesFromDevice_DeviceTypeEmpty() {
        // Forțăm ramura: deviceType.trim().isEmpty() (B is False)
        String json = "{\"devices\": [{\"device\": {\"name\": \"Senzor\", \"deviceType\": \"   \"}}]}";
        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(61);
        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(61));

        assertEquals(1, result.size());
        assertFalse(result.contains("   "));
    }

    @Test
    void testCollectNamesFromDevice_DeviceTypeAlreadyExists() {
        // Forțăm ramura: deviceNames.contains(deviceType) este True (deci !C e False)
        // Punem două dispozitive diferite care au același tip
        String json = """
            {
              "devices": [
                { "device": { "name": "Bec Dormitor", "deviceType": "Lumina" } },
                { "device": { "name": "Bec Baie", "deviceType": "Lumina" } }
              ]
            }
            """;
        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(62);
        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(62));

        // Ar trebui să avem: "Bec Dormitor", "Lumina", "Bec Baie"
        // Al doilea "Lumina" trebuie să fie respins de condiția !contains
        assertEquals(3, result.size());
        // Verificăm de câte ori apare "Lumina"
        long count = result.stream().filter(s -> s.equals("Lumina")).count();
        assertEquals(1, count, "Tipul 'Lumina' ar trebui să fie adăugat o singură dată");
    }

    @Test
    void testBranches_EmptyAndNullChecks() {
        // Testăm ramura: if (drawingJson == null || drawingJson.isEmpty())
        Layout layoutNull = new Layout();
        layoutNull.setDrawing(null);

        Layout layoutEmpty = new Layout();
        layoutEmpty.setDrawing("");

        doReturn(Optional.of(layoutNull)).when(layoutRepository).findById(10);
        doReturn(Optional.of(layoutEmpty)).when(layoutRepository).findById(11);

        assertTrue(aiLayoutService.extractExistingDeviceNames(List.of(10)).isEmpty());
        assertTrue(aiLayoutService.extractExistingDeviceNames(List.of(11)).isEmpty());
    }

    @Test
    void testBranch_NotAnArray() {
        // Testăm ramura: if (devices.isArray()) -> cazul FALSE
        String json = "{\"devices\": \"nu sunt un array, sunt un string\"}";
        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(20);

        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(20));
        assertTrue(result.isEmpty()); // Intră în if, vede că nu e array, sare peste for
    }

    @Test
    void testBranch_InvalidJsonCatch() {
        // Testăm ramura: catch (Exception e)
        String json = "{ error: json invalid }";
        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(30);

        // Nu trebuie să crape, trebuie să returneze listă goală (branch-ul de catch)
        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(30));
        assertTrue(result.isEmpty());
    }

    @Test
    void testBranch_NotFound() {
        // Testăm ramura: ifPresent -> cazul FALSE
        doReturn(Optional.empty()).when(layoutRepository).findById(40);

        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(40));
        assertTrue(result.isEmpty());
    }

    @Test
    void testBranch_NameTrimEmpty() {
        // Testăm ramura: !name.trim().isEmpty() -> cazul FALSE (doar spații)
        String json = "{\"devices\": [{\"device\": {\"name\": \"   \", \"deviceType\": \"Test\"}}]}";
        Layout layout = new Layout();
        layout.setDrawing(json);

        doReturn(Optional.of(layout)).when(layoutRepository).findById(50);

        List<String> result = aiLayoutService.extractExistingDeviceNames(List.of(50));
        // Ar trebui să aibă doar "Test", nu și spațiile
        assertEquals(1, result.size());
        assertFalse(result.contains("   "));
    }
}