package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.model.HouseConfiguration;
import gr.A4.SmartHouseBuilder.dto.HouseConfigurationRequest;
import gr.A4.SmartHouseBuilder.repository.HouseConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HouseConfigurationService {

    private final HouseConfigurationRepository repository;

    public HouseConfiguration saveHouseConfiguration(HouseConfigurationRequest request) {
        HouseConfiguration config = new HouseConfiguration();
        config.setName(request.getName());
        config.setCreatedAt(LocalDateTime.parse(request.getCreatedAt(), DateTimeFormatter.ISO_DATE_TIME));
        config.setWalls(request.getElements().getWalls());
        config.setWindows(request.getElements().getWindows());
        config.setDoors(request.getElements().getDoors());
        config.setDevices(request.getElements().getDevices());
        config.setFurniture(request.getElements().getFurniture());

        return repository.save(config);
    }

    public List<HouseConfiguration> getAllConfigurations() {
        return repository.findAll();
    }
}