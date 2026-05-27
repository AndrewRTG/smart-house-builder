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
import java.util.Arrays;
import java.util.Map;
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

    @Test
    void createsNewDeviceWithAllImportFieldsAndPriceHistory() {
        Category category = new Category();
        category.setId(7);
        DeviceImportDto dto = dto("New Smart Plug", 44.0, 7);
        dto.setCommunicationProtocol("Wi-Fi");
        dto.setSpecifications(Map.of("power", "16A"));

        when(parser.parse(any())).thenReturn(List.of(dto));
        when(deviceRepository.findByName("New Smart Plug")).thenReturn(Optional.empty());
        when(categoryRepository.findById(7)).thenReturn(Optional.of(category));
        when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        verify(deviceRepository).save(argThat(device ->
                "New Smart Plug".equals(device.getName())
                        && "Aqara".equals(device.getBrand())
                        && "Wi-Fi".equals(device.getCommunicationProtocol())
                        && Map.of("power", "16A").equals(device.getSpecifications())
                        && category.equals(device.getCategory())
                        && 44.0 == device.getBestPrice()
        ));
        verify(priceHistoryRepository).save(argThat(history ->
                "ROVISION".equals(history.getStoreName())
                        && history.getPrice().equals(44.0)
                        && "https://example.test/product".equals(history.getProductUrl())
                        && history.getScrapedAt() != null
        ));
    }

    @Test
    void skipsInvalidDtosAndDtosWithUnknownCategories() {
        DeviceImportDto blankName = dto(" ", 44.0, 1);
        DeviceImportDto noPrice = dto("No price", null, 1);
        DeviceImportDto zeroPrice = dto("Zero price", 0.0, 1);
        DeviceImportDto noCategory = dto("No category", 12.0, null);
        DeviceImportDto noStore = dto("No store", 12.0, 1);
        noStore.setSourceStore(" ");
        DeviceImportDto noUrl = dto("No url", 12.0, 1);
        noUrl.setProductUrl(" ");
        DeviceImportDto unknownCategory = dto("Unknown category", 12.0, 99);

        when(parser.parse(any())).thenReturn(Arrays.asList(
                null,
                blankName,
                noPrice,
                zeroPrice,
                noCategory,
                noStore,
                noUrl,
                unknownCategory
        ));
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        verify(deviceRepository, never()).save(any(Device.class));
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));
    }

    @Test
    void fillsMissingExistingFieldsAndUpdatesMissingBestPrice() {
        Device existing = new Device();
        existing.setName("Existing Sensor");
        existing.setBestPrice(null);

        Category category = new Category();
        DeviceImportDto dto = dto("Existing Sensor", 35.0, 8);
        dto.setCommunicationProtocol("Zigbee");
        dto.setSpecifications(Map.of("battery", "yes"));

        when(parser.parse(any())).thenReturn(List.of(dto));
        when(deviceRepository.findByName("Existing Sensor")).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(8)).thenReturn(Optional.of(category));
        when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        assertThat(existing.getBrand()).isEqualTo("Aqara");
        assertThat(existing.getDescription()).isEqualTo("Useful smart device");
        assertThat(existing.getImageUrl()).isEqualTo("https://example.test/device.png");
        assertThat(existing.getCategory()).isEqualTo(category);
        assertThat(existing.getCommunicationProtocol()).isEqualTo("Zigbee");
        assertThat(existing.getSpecifications()).isEqualTo(Map.of("battery", "yes"));
        assertThat(existing.getBestPrice()).isEqualTo(35.0);
        assertThat(existing.getBestPriceUrl()).isEqualTo("https://example.test/product");
    }

    @Test
    void preservesExistingFilledFieldsAndDoesNotImproveWithInvalidPrice() {
        Device existing = new Device();
        existing.setName("Existing Hub");
        existing.setBrand("OldBrand");
        existing.setDescription("Old description");
        existing.setImageUrl("https://old/image.png");
        existing.setCategory(new Category());
        existing.setCommunicationProtocol("Matter");
        existing.setBestPrice(120.0);

        DeviceImportDto dto = dto("Existing Hub", -1.0, 5);
        dto.setCommunicationProtocol("Zigbee");
        dto.setSpecifications(null);

        when(parser.parse(any())).thenReturn(List.of(dto));
        when(deviceRepository.findByName("Existing Hub")).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(5)).thenReturn(Optional.of(new Category()));
        when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        service.importDevicesFromXml("ROVISION", new ByteArrayInputStream("<xml/>".getBytes()));

        verify(deviceRepository, never()).save(any(Device.class));
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));
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
