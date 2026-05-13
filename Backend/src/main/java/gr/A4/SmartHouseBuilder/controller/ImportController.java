package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.service.DeviceImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URL;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final DeviceImportService importService;

    @PostMapping("/url")
    public ResponseEntity<String> importFromUrl(
            @RequestParam String store,
            @RequestParam String feedUrl) {

        try {
            // 1. Deschidem o conexiune directă către link-ul magazinului
            System.out.println("Se descarcă datele de la: " + feedUrl);
            InputStream xmlStream = new URL(feedUrl).openStream();

            // 2. Trimitem "tubul" de date direct în serviciul nostru
            importService.importDevicesFromXml(store, xmlStream);

            // 3. Închidem conexiunea
            xmlStream.close();

            return ResponseEntity.ok("Import finalizat cu succes pentru magazinul: " + store);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("A apărut o eroare la import: " + e.getMessage());
        }
    }
}