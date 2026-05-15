package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.PriceHistoryRequest;
import gr.A4.SmartHouseBuilder.entity.Device;
import gr.A4.SmartHouseBuilder.entity.PriceHistory;
import gr.A4.SmartHouseBuilder.exception.ResourceNotFoundException;
import gr.A4.SmartHouseBuilder.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.PriceHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceHistoryServiceTest {

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @Mock
    private DeviceRepository deviceRepository;

    @InjectMocks
    private PriceHistoryService priceHistoryService;

    @Test
    void addPrice_usesCheapestRecordToUpdateDevice() {
        Device device = Device.builder().id(3).name("Sensor").build();
        PriceHistory cheapest = new PriceHistory();
        cheapest.setPrice(149.99);
        cheapest.setProductUrl("https://cheap.example");
        LocalDateTime scrapedAt = LocalDateTime.now();
        when(deviceRepository.findById(3)).thenReturn(Optional.of(device));
        when(priceHistoryRepository.findCheapestCurrentRecord(3)).thenReturn(Optional.of(cheapest));

        var response = priceHistoryService.addPrice(new PriceHistoryRequest(
                3,
                "Store A",
                199.99,
                "https://store-a.example",
                scrapedAt
        ));

        assertThat(response.deviceId()).isEqualTo(3);
        assertThat(response.storeName()).isEqualTo("Store A");
        assertThat(device.getBestPrice()).isEqualTo(149.99);
        assertThat(device.getBestPriceUrl()).isEqualTo("https://cheap.example");

        ArgumentCaptor<PriceHistory> captor = ArgumentCaptor.forClass(PriceHistory.class);
        verify(priceHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getStoreName()).isEqualTo("Store A");
    }

    @Test
    void addPrice_fallsBackToSavedRecordWhenNoCheaperRecordExists() {
        Device device = Device.builder().id(9).name("Hub").build();
        LocalDateTime scrapedAt = LocalDateTime.now();
        when(deviceRepository.findById(9)).thenReturn(Optional.of(device));
        when(priceHistoryRepository.findCheapestCurrentRecord(9)).thenReturn(Optional.empty());

        priceHistoryService.addPrice(new PriceHistoryRequest(
                9,
                "Store B",
                89.5,
                "https://store-b.example",
                scrapedAt
        ));

        assertThat(device.getBestPrice()).isEqualTo(89.5);
        assertThat(device.getBestPriceUrl()).isEqualTo("https://store-b.example");
        verify(deviceRepository).save(device);
    }

    @Test
    void addPrice_throwsWhenDeviceDoesNotExist() {
        when(deviceRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> priceHistoryService.addPrice(new PriceHistoryRequest(
                99, "Store", 10.0, "https://x.example", LocalDateTime.now()
        )))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }
}
