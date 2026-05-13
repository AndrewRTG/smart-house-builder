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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeviceImportServiceTest {

    @Mock
    private ParserFactory parserFactory;

    @Mock
    private StoreParser parser;

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private DeviceImportService service;

    @BeforeEach
    void setUp() {
        service = new DeviceImportService(parserFactory, deviceRepository, priceHistoryRepository, categoryRepository);
        when(parserFactory.getParserForStore("ROVISION")).thenReturn(parser);
    }

    @Test
    void importsNewDeviceWithCategoryAndPriceHistory() {
        Category category = new Category();
        category.setId(2);
        DeviceImportDto dto = dto("Smart Sensor", 99.0, 2);
        when(parser.parse(any())).thenReturn(List.of(dto));
        when(deviceRepository.findByName("Smart Sensor")).thenReturn(Optional.empty());
        when(categoryRepository.findById(2)).thenReturn(Optional.of(category));
        when(deviceRepository.save(any(Device.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        ArgumentCaptor<Device> deviceCaptor = ArgumentCaptor.forClass(Device.class);
        verify(deviceRepository).save(deviceCaptor.capture());
        assertThat(deviceCaptor.getValue().getName()).isEqualTo("Smart Sensor");
        assertThat(deviceCaptor.getValue().getBrand()).isEqualTo("Aqara");
        assertThat(deviceCaptor.getValue().getCategory()).isSameAs(category);
        assertThat(deviceCaptor.getValue().getBestPrice()).isEqualTo(99.0);

        ArgumentCaptor<PriceHistory> historyCaptor = ArgumentCaptor.forClass(PriceHistory.class);
        verify(priceHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getDevice()).isSameAs(deviceCaptor.getValue());
        assertThat(historyCaptor.getValue().getStoreName()).isEqualTo("ROVISION");
        assertThat(historyCaptor.getValue().getPrice()).isEqualTo(99.0);
        assertThat(historyCaptor.getValue().getScrapedAt()).isNotNull();
    }

    @Test
    void updatesExistingDeviceOnlyWhenImportedPriceIsLower() {
        Device existing = new Device();
        existing.setName("Smart Sensor");
        existing.setBestPrice(120.0);
        when(parser.parse(any())).thenReturn(List.of(dto("Smart Sensor", 80.0, null)));
        when(deviceRepository.findByName("Smart Sensor")).thenReturn(Optional.of(existing));
        when(deviceRepository.save(existing)).thenReturn(existing);

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
        when(parser.parse(any())).thenReturn(List.of(dto("Smart Sensor", 80.0, null)));
        when(deviceRepository.findByName("Smart Sensor")).thenReturn(Optional.of(existing));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        assertThat(existing.getBestPrice()).isEqualTo(50.0);
        verify(deviceRepository, never()).save(any(Device.class));
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    @Test
    void fallsBackToDefaultCategoryAndSkipsWhenNoCategoryExists() {
        DeviceImportDto fallbackDto = dto("Fallback Device", 45.0, null);
        DeviceImportDto skippedDto = dto("Skipped Device", 35.0, 9);
        Category fallback = new Category();
        fallback.setId(1);
        when(parser.parse(any())).thenReturn(List.of(fallbackDto, skippedDto));
        when(deviceRepository.findByName("Fallback Device")).thenReturn(Optional.empty());
        when(deviceRepository.findByName("Skipped Device")).thenReturn(Optional.empty());
        when(categoryRepository.findById(1)).thenReturn(Optional.of(fallback), Optional.empty());
        when(categoryRepository.findById(9)).thenReturn(Optional.empty());
        when(deviceRepository.save(any(Device.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        ArgumentCaptor<Device> deviceCaptor = ArgumentCaptor.forClass(Device.class);
        verify(deviceRepository).save(deviceCaptor.capture());
        assertThat(deviceCaptor.getValue().getName()).isEqualTo("Fallback Device");
        assertThat(deviceCaptor.getValue().getCategory()).isSameAs(fallback);
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    private static DeviceImportDto dto(String name, Double price, Integer categoryId) {
        DeviceImportDto dto = new DeviceImportDto();
        dto.setName(name);
        dto.setPrice(price);
        dto.setBrand("Aqara");
        dto.setDescription("Useful smart device");
        dto.setImageUrl("https://example.test/device.png");
        dto.setSourceStore("ROVISION");
        dto.setCategoryId(categoryId);
        return dto;
    }
}
