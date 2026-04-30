package gr.A4.SmartHouseBuilder.endpoint.service;

import gr.A4.SmartHouseBuilder.endpoint.dto.PriceHistoryRequest;
import gr.A4.SmartHouseBuilder.endpoint.dto.PriceHistoryResponse;
import gr.A4.SmartHouseBuilder.endpoint.entity.Device;
import gr.A4.SmartHouseBuilder.endpoint.entity.PriceHistory;
import gr.A4.SmartHouseBuilder.endpoint.exception.ResourceNotFoundException;
import gr.A4.SmartHouseBuilder.endpoint.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.endpoint.repository.PriceHistoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PriceHistoryService {
    private final PriceHistoryRepository priceHistoryRepository;
    private final DeviceRepository deviceRepository;

    @Transactional
    public PriceHistoryResponse addPrice (PriceHistoryRequest request) {
        Device device = deviceRepository.findById(request.deviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device-ul cu ID-ul " + request.deviceId() + " nu a fost gasit!"));

        PriceHistory priceHistory = new PriceHistory();
        priceHistory.setDevice(device);
        priceHistory.setStoreName(request.storeName());
        priceHistory.setPrice(request.price());
        priceHistory.setProductUrl(request.productUrl());
        priceHistory.setScrapedAt(request.scrapedAt());
        priceHistoryRepository.save(priceHistory);

        PriceHistory cheapestRecord = priceHistoryRepository.findCheapestCurrentRecord(device.getId())
                .orElse(priceHistory);

        device.setBestPrice(cheapestRecord.getPrice());
        device.setBestPriceUrl(cheapestRecord.getProductUrl());
        deviceRepository.save(device);

        return new PriceHistoryResponse(
                priceHistory.getId(),
                device.getId(),
                priceHistory.getStoreName(),
                priceHistory.getPrice(),
                priceHistory.getProductUrl(),
                priceHistory.getScrapedAt()
        );

    }
}
