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
        StoreParser parser = parserFactory.getParserForStore(storeIdentifier);

        List<DeviceImportDto> importedDevices = parser.parse(xmlStream);

        int savedCount = 0;
        int skippedCount = 0;

        for (DeviceImportDto dto : importedDevices) {
            boolean saved = saveOrUpdateDevice(dto);

            if (saved) {
                savedCount++;
            } else {
                skippedCount++;
            }
        }

        System.out.println("Import finalizat pentru magazinul: " + storeIdentifier);
        System.out.println("Produse primite de la parser: " + importedDevices.size());
        System.out.println("Produse salvate/actualizate: " + savedCount);
        System.out.println("Produse sarite: " + skippedCount);
    }

    private boolean saveOrUpdateDevice(DeviceImportDto dto) {
        if (!isValidDto(dto)) {
            System.out.println("SARIT: DTO invalid: " + getSafeName(dto));
            return false;
        }

        Category category = categoryRepository.findById(dto.getCategoryId()).orElse(null);

        if (category == null) {
            System.out.println("SARIT: Produsul '" + dto.getName() + "' are categoryId invalid: " + dto.getCategoryId());
            return false;
        }

        Optional<Device> existingDeviceOpt = deviceRepository.findByName(dto.getName());

        Device device;

        if (existingDeviceOpt.isPresent()) {
            device = existingDeviceOpt.get();

            updateExistingDeviceBasicFields(device, dto, category);

            if (isBetterPrice(dto.getPrice(), device.getBestPrice())) {
                device.setBestPrice(dto.getPrice());
                device.setBestPriceUrl(dto.getProductUrl());
            }

            device = deviceRepository.save(device);
        } else {
            device = createNewDevice(dto, category);
            device = deviceRepository.save(device);
        }

        savePriceHistory(device, dto);

        return true;
    }

    private Device createNewDevice(DeviceImportDto dto, Category category) {
        Device device = new Device();

        device.setName(dto.getName());
        device.setBrand(dto.getBrand());
        device.setDescription(dto.getDescription());
        device.setImageUrl(dto.getImageUrl());
        device.setCategory(category);

        device.setBestPrice(dto.getPrice());
        device.setBestPriceUrl(dto.getProductUrl());

        device.setCommunicationProtocol(dto.getCommunicationProtocol());
        device.setSpecifications(dto.getSpecifications());

        return device;
    }

    private void updateExistingDeviceBasicFields(Device device, DeviceImportDto dto, Category category) {
        if (isBlank(device.getBrand()) && !isBlank(dto.getBrand())) {
            device.setBrand(dto.getBrand());
        }

        if (isBlank(device.getDescription()) && !isBlank(dto.getDescription())) {
            device.setDescription(dto.getDescription());
        }

        if (isBlank(device.getImageUrl()) && !isBlank(dto.getImageUrl())) {
            device.setImageUrl(dto.getImageUrl());
        }

        if (device.getCategory() == null) {
            device.setCategory(category);
        }

        if (isBlank(device.getCommunicationProtocol()) && !isBlank(dto.getCommunicationProtocol())) {
            device.setCommunicationProtocol(dto.getCommunicationProtocol());
        }
        if (dto.getSpecifications() != null) {
            device.setSpecifications(dto.getSpecifications());
        }
    }

    private void savePriceHistory(Device device, DeviceImportDto dto) {
        PriceHistory priceHistory = new PriceHistory();

        priceHistory.setDevice(device);
        priceHistory.setStoreName(dto.getSourceStore());
        priceHistory.setPrice(dto.getPrice());
        priceHistory.setProductUrl(dto.getProductUrl());
        priceHistory.setScrapedAt(LocalDateTime.now());

        priceHistoryRepository.save(priceHistory);
    }

    private boolean isValidDto(DeviceImportDto dto) {
        if (dto == null) {
            return false;
        }

        if (isBlank(dto.getName())) {
            return false;
        }

        if (dto.getPrice() == null || dto.getPrice() <= 0) {
            return false;
        }

        if (dto.getCategoryId() == null) {
            return false;
        }

        if (isBlank(dto.getSourceStore())) {
            return false;
        }

        if (isBlank(dto.getProductUrl())) {
            return false;
        }

        return true;
    }

    private boolean isBetterPrice(Double newPrice, Double currentBestPrice) {
        if (newPrice == null || newPrice <= 0) {
            return false;
        }

        if (currentBestPrice == null || currentBestPrice <= 0) {
            return true;
        }

        return newPrice < currentBestPrice;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String getSafeName(DeviceImportDto dto) {
        if (dto == null || dto.getName() == null) {
            return "null";
        }

        return dto.getName();
    }
}