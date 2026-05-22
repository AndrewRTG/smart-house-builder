package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.DeviceRequest;
import gr.A4.SmartHouseBuilder.entity.Category;
import gr.A4.SmartHouseBuilder.entity.Device;
import gr.A4.SmartHouseBuilder.entity.PriceHistory;
import gr.A4.SmartHouseBuilder.exception.ResourceNotFoundException;
import gr.A4.SmartHouseBuilder.repository.CategoryRepository;
import gr.A4.SmartHouseBuilder.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.PriceHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeviceServiceTest {

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @InjectMocks
    private DeviceService deviceService;

    @Test
    void createDevice_mapsRequestAndReturnsResponse() {
        Category category = new Category();
        category.setId(2);
        category.setName("Security");
        Device saved = Device.builder()
                .id(7)
                .category(category)
                .name("Door Sensor")
                .brand("Aqara")
                .description("Contact sensor")
                .imageUrl("img")
                .communicationProtocol("Zigbee")
                .specifications(Map.of("battery", "CR2032"))
                .build();
        when(categoryRepository.findById(2)).thenReturn(Optional.of(category));
        when(deviceRepository.save(any(Device.class))).thenReturn(saved);

        var response = deviceService.createDevice(new DeviceRequest(
                2,
                "Door Sensor",
                "Aqara",
                "Contact sensor",
                "img",
                "Zigbee",
                Map.of("battery", "CR2032")
        ));

        assertThat(response.id()).isEqualTo(7);
        assertThat(response.categoryName()).isEqualTo("Security");
        assertThat(response.communicationProtocol()).isEqualTo("Zigbee");
    }

    @Test
    void createDevice_throwsWhenCategoryIsMissing() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deviceService.createDevice(new DeviceRequest(
                99, "Name", "Brand", "Desc", null, null, Map.of()
        )))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getAllDevices_mapsEntitiesToResponses() {
        Category category = new Category();
        category.setId(1);
        category.setName("Lighting");
        Device device = Device.builder()
                .id(5)
                .category(category)
                .name("Bulb")
                .brand("Philips")
                .description("Smart bulb")
                .build();
        when(deviceRepository.findAll()).thenReturn(List.of(device));

        var result = deviceService.getAllDevices();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).categoryName()).isEqualTo("Lighting");
    }

    @Test
    void getFilteredDevices_usesMappedSortColumnAndReturnsMappedResults() {
        Category category = new Category();
        category.setId(3);
        category.setName("Comfort");
        Device device = Device.builder().id(1).category(category).name("Thermostat").build();
        when(deviceRepository.findWithFilters(any(), any(), any(), any(), any(), any(Sort.class)))
                .thenReturn(List.of(device));

        var result = deviceService.getFilteredDevices(
                List.of(3), "Nest", 300.0, 50.0, List.of("WiFi"), "price", "asc"
        );

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(deviceRepository).findWithFilters(eq(List.of(3)), eq("Nest"), eq(300.0), eq(50.0), eq(List.of("WiFi")), sortCaptor.capture());
        assertThat(sortCaptor.getValue().toString()).contains("best_price: ASC");
        assertThat(result).hasSize(1);
    }

    @Test
    void getFilteredDevices_usesDefaultIdSortForUnknownColumnAndDescendingDirection() {
        Category category = new Category();
        category.setId(4);
        category.setName("Climate");
        when(deviceRepository.findWithFilters(any(), any(), any(), any(), any(), any(Sort.class)))
                .thenReturn(List.of(Device.builder().id(2).category(category).name("Humidifier").build()));

        deviceService.getFilteredDevices(
                null, null, null, null, null, "unsupported", "desc"
        );

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(deviceRepository).findWithFilters(isNull(), isNull(), isNull(), isNull(), isNull(), sortCaptor.capture());
        assertThat(sortCaptor.getValue().toString()).contains("id: DESC");
    }

    @Test
    void getSearchSuggestion_handlesBlankInputAndDelegatesOtherwise() {
        when(deviceRepository.findDidYouMeanSuggestion("thermo")).thenReturn("thermostat");

        assertThat(deviceService.getSearchSuggestion("   ")).isNull();
        assertThat(deviceService.getSearchSuggestion("thermo")).isEqualTo("thermostat");
    }

    @Test
    void getDeviceOffers_mapsEntitiesToResponses_whenDeviceExists() {
        Device mockDevice = Device.builder().id(1).name("Hub").build();
        when(deviceRepository.findById(1)).thenReturn(Optional.of(mockDevice));

        PriceHistory ph1 = PriceHistory.builder()
                .storeName("eMAG")
                .price(150.0)
                .productUrl("emag.ro/hub")
                .scrapedAt(LocalDateTime.now())
                .build();
        PriceHistory ph2 = PriceHistory.builder()
                .storeName("PC Garage")
                .price(145.0)
                .productUrl("pcgarage.ro/hub")
                .scrapedAt(LocalDateTime.now())
                .build();

        when(priceHistoryRepository.findLatestOffersForDevice(1)).thenReturn(List.of(ph1, ph2));

        var result = deviceService.getDeviceOffers(1);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).storeName()).isEqualTo("eMAG");
        assertThat(result.get(0).price()).isEqualTo(150.0);
        assertThat(result.get(1).storeName()).isEqualTo("PC Garage");

        verify(deviceRepository).findById(1);
        verify(priceHistoryRepository).findLatestOffersForDevice(1);
    }

    @Test
    void getDeviceOffers_throwsException_whenDeviceNotFound() {
        when(deviceRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deviceService.getDeviceOffers(99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");

        verify(priceHistoryRepository, org.mockito.Mockito.never()).findLatestOffersForDevice(anyInt());
    }

    @Test
    void getDeviceOffers_returnsEmptyList_whenNoOffersAvailable() {
        Device mockDevice = Device.builder().id(2).name("Senzor").build();
        when(deviceRepository.findById(2)).thenReturn(Optional.of(mockDevice));

        when(priceHistoryRepository.findLatestOffersForDevice(2)).thenReturn(Collections.emptyList());

        var result = deviceService.getDeviceOffers(2);

        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
    }
}
