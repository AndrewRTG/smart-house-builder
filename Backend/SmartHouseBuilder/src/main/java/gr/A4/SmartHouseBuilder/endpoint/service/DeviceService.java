package gr.A4.SmartHouseBuilder.endpoint.service;


import gr.A4.SmartHouseBuilder.endpoint.dto.DeviceRequest;
import gr.A4.SmartHouseBuilder.endpoint.dto.DeviceResponse;
import gr.A4.SmartHouseBuilder.endpoint.entity.Category;
import gr.A4.SmartHouseBuilder.endpoint.entity.Device;
import gr.A4.SmartHouseBuilder.endpoint.exception.ResourceNotFoundException;
import gr.A4.SmartHouseBuilder.endpoint.repository.CategoryRepository;
import gr.A4.SmartHouseBuilder.endpoint.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceService {
    private final DeviceRepository deviceRepository;
    private final CategoryRepository categoryRepository;

    public DeviceResponse createDevice (DeviceRequest request){
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria cu Id-ul: " + request.categoryId() + " nu a fost gasita!"));

        Device device = new Device();
        device.setCategory(category);
        device.setName(request.name());
        device.setBrand(request.brand());
        device.setDescription(request.description());
        device.setImageUrl(request.imageUrl());
        device.setCommunicationProtocol(request.communicationProtocol());
        device.setSpecifications(request.specifications());

        device = deviceRepository.save(device);
        return new DeviceResponse(
                device.getId(),
                category.getId(),
                category.getName(),
                device.getName(),
                device.getBrand(),
                device.getDescription(),
                device.getImageUrl(),
                device.getCommunicationProtocol(),
                device.getSpecifications(),
                device.getBestPrice(),
                device.getBestPriceUrl());
    }
    public List<DeviceResponse> getAllDevices() {
        return deviceRepository.findAll().stream()
                .map(d -> new DeviceResponse(
                        d.getId(), d.getCategory().getId(), d.getCategory().getName(),
                        d.getName(), d.getBrand(), d.getDescription(),
                        d.getImageUrl(), d.getCommunicationProtocol(), d.getSpecifications(),
                        d.getBestPrice(),d.getBestPriceUrl()
                )).toList();
    }
    public List<DeviceResponse> getFilteredDevices(Integer categoryId, String brand, Double maxPrice) {
        return deviceRepository.findWithFilters(categoryId, brand, maxPrice).stream()
                .map(d -> new DeviceResponse(
                        d.getId(),
                        d.getCategory().getId(),
                        d.getCategory().getName(),
                        d.getName(),
                        d.getBrand(),
                        d.getDescription(),
                        d.getImageUrl(),
                        d.getCommunicationProtocol(),
                        d.getSpecifications(),
                        d.getBestPrice(),
                        d.getBestPriceUrl()
                )).toList();
    }
}
