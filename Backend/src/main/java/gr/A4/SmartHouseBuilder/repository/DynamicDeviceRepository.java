package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import java.util.List;

public interface DynamicDeviceRepository {
    List<HardwareDevice> executeQuery(String sql);
}