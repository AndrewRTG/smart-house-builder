package gr.A4.SmartHouseBuilder.team2.util;

import gr.A4.SmartHouseBuilder.model.Device;
import gr.A4.SmartHouseBuilder.model.PlacedDevice;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.team2.dto.PlacedDeviceDTO;
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

    private PlacedDevice mapDevice(PlacedDeviceDTO dto) {
        PlacedDevice pd = new PlacedDevice();
        Device d = new Device();

        d.setName(dto.getName());
        d.setDeviceType(dto.getCategory());
        d.setEcosystem(dto.getEcosystem());
        d.setProtocol(dto.getProtocol());

        pd.setDevice(d);
        pd.setX(dto.getX());
        pd.setY(dto.getY());
        return pd;
    }
}
