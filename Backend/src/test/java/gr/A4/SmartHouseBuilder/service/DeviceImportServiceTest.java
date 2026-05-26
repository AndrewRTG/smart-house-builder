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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.ByteArrayInputStream;
import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeviceImportServiceTest {

    @Mock private ParserFactory parserFactory;
    @Mock private StoreParser parser;
    @Mock private DeviceRepository deviceRepository;
    @Mock private PriceHistoryRepository priceHistoryRepository;
    @Mock private CategoryRepository categoryRepository;

    private DeviceImportService service;

    @BeforeEach
    void setUp() {
        service = new DeviceImportService(parserFactory, deviceRepository, priceHistoryRepository, categoryRepository);
        when(parserFactory.getParserForStore("ROVISION")).thenReturn(parser);
    }

    @Test
    void updatesExistingDeviceOnlyWhenImportedPriceIsLower() {
        Device existing = new Device();
        existing.setName("Smart Sensor");
        existing.setBestPrice(120.0);

        Category category = new Category();

        DeviceImportDto dto = dto("Smart Sensor", 80.0, 1);

        when(parser.parse(any())).thenReturn(List.of(dto));
        when(deviceRepository.findByName("Smart Sensor")).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        assertThat(existing.getBestPrice()).isEqualTo(80.0);
        verify(deviceRepository).save(existing);
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    @Test
    void keepsExistingPriceWhenImportedPriceIsNotBetter() {
        Device existing = new Device();
        existing.setName("Smart Sensor");
        existing.setBestPrice(50.0);

        DeviceImportDto dto = dto("Smart Sensor", 80.0, 1);

        when(parser.parse(any())).thenReturn(List.of(dto));
        when(deviceRepository.findByName("Smart Sensor")).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(new Category()));
        when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        assertThat(existing.getBestPrice()).isEqualTo(50.0);

        verify(deviceRepository).save(any(Device.class));
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    private static DeviceImportDto dto(String name, Double price, Integer categoryId) {
        DeviceImportDto dto = new DeviceImportDto();
        dto.setName(name);
        dto.setPrice(price);
        dto.setCategoryId(categoryId);
        dto.setBrand("Aqara");
        dto.setDescription("Useful smart device");
        dto.setImageUrl("https://example.test/device.png");
        dto.setSourceStore("ROVISION");
        dto.setProductUrl("https://example.test/product");
        return dto;
    }
}