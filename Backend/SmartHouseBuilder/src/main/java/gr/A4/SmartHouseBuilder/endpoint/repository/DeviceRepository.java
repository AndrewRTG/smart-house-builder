package gr.A4.SmartHouseBuilder.endpoint.repository;

import gr.A4.SmartHouseBuilder.endpoint.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device,Integer> {
}
