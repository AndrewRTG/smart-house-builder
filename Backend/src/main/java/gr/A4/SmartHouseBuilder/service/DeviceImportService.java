package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.DeviceImportDto;
import gr.A4.SmartHouseBuilder.entity.Category;
import gr.A4.SmartHouseBuilder.entity.Device;
import gr.A4.SmartHouseBuilder.entity.PriceHistory;
import gr.A4.SmartHouseBuilder.repository.CategoryRepository;
import gr.A4.SmartHouseBuilder.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.PriceHistoryRepository;
import gr.A4.SmartHouseBuilder.service.parser.ParserFactory;
import gr.A4.SmartHouseBuilder.service.parser.StoreParser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeviceImportService {

    private final ParserFactory parserFactory;
    private final DeviceRepository deviceRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public void importDevicesFromXml(String storeIdentifier, InputStream xmlStream) {
        // 1. Obținem parserul potrivit de la Factory (ex: pentru "ROVISION")
        StoreParser parser = parserFactory.getParserForStore(storeIdentifier);

        // 2. Parsăm XML-ul și obținem lista de produse (DTOs)
        List<DeviceImportDto> importedDevices = parser.parse(xmlStream);

        // 3. Trecem prin fiecare produs și îl salvăm în baza de date
        for (DeviceImportDto dto : importedDevices) {
            saveOrUpdateDevice(dto);
        }

        System.out.println("Import finalizat pentru magazinul: " + storeIdentifier + ". S-au procesat " + importedDevices.size() + " produse.");
    }

    private void saveOrUpdateDevice(DeviceImportDto dto) {
        // Verificăm dacă produsul există deja în baza de date (după nume)
        Optional<Device> existingDeviceOpt = deviceRepository.findByName(dto.getName());
        Device device;

        if (existingDeviceOpt.isPresent()) {
            device = existingDeviceOpt.get();
            if (device.getBestPrice() == null || dto.getPrice() < device.getBestPrice()) {
                device.setBestPrice(dto.getPrice());
                device = deviceRepository.save(device);
            }
        } else {
            device = new Device();
            device.setName(dto.getName());
            device.setBrand(dto.getBrand());
            device.setDescription(dto.getDescription());
            device.setImageUrl(dto.getImageUrl());
            device.setBestPrice(dto.getPrice());

            // --- LOGICA NOUĂ DE SIGURANȚĂ PENTRU CATEGORIE ---

            // Încercăm să găsim categoria primită de la parser
            Category category = null;
            if (dto.getCategoryId() != null) {
                category = categoryRepository.findById(dto.getCategoryId()).orElse(null);
            }

            // Dacă parserul nu a dat categorie (null) SAU ID-ul nu există în DB
            if (category == null) {
                // Încercăm să luăm categoria cu ID 1 (Fallback)
                category = categoryRepository.findById(1).orElse(null);
            }

            // Dacă am găsit o categorie (fie a parserului, fie cea de fallback), o setăm
            if (category != null) {
                device.setCategory(category);
            } else {
                // Dacă nici categoria 1 nu există, dăm skip la produs ca să nu crape tot importul
                System.out.println("SĂRIT: Produsul '" + dto.getName() + "' nu are categorie și ID 1 lipsește din DB.");
                return;
            }
            // ------------------------------------------------

            device = deviceRepository.save(device);
        }

        // Adăugăm la istoricul de prețuri
        PriceHistory priceHistory = new PriceHistory();
        priceHistory.setDevice(device);
        priceHistory.setStoreName(dto.getSourceStore());
        priceHistory.setPrice(dto.getPrice());
        priceHistory.setScrapedAt(LocalDateTime.now());

        priceHistoryRepository.save(priceHistory);
    }
}