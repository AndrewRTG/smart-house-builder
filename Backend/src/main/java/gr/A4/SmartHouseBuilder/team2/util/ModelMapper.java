package gr.A4.SmartHouseBuilder.team2.util;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceRichDTO;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ModelMapper {

    public SetupBuild toEngineModel(SetupBuildDTO dto) {
        if (dto == null) {
            return null;
        }

        SetupBuild model = new SetupBuild();
        model.setMaxBudget(dto.getMaxBudget());
        model.setTargetEcosystem(dto.getTargetEcosystem());

        if (dto.getDevices() != null) {
            model.setDevices(dto.getDevices().stream()
                    .map(this::mapDevice)
                    .collect(Collectors.toList()));
        }
        return model;
    }

    private PlacedDevice mapDevice(PlacedDeviceRichDTO dto) {
        PlacedDevice pd = new PlacedDevice();
        Device d = new Device();

        if (dto != null && dto.getDevice() != null) {
            d.setName(dto.getDevice().getName());
            d.setDeviceType(dto.getDevice().getDeviceType());
            d.setEcosystem(dto.getDevice().getEcosystem());
            d.setProtocol(dto.getDevice().getProtocol());
        }

        pd.setDevice(d);
        if (dto != null && dto.getCoordinates() != null) {
            pd.setX(dto.getCoordinates().getX());
            pd.setY(dto.getCoordinates().getY());
        }
        return pd;
    }
}
