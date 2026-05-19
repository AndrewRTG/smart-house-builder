package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HardwareDeviceRepository extends JpaRepository<HardwareDevice, Long> {
    @Query(value = "SELECT * FROM devices ORDER BY RANDOM() LIMIT 5", nativeQuery = true)
    List<HardwareDevice> findRandomDevices();
    List<HardwareDevice> findByCategoryId(Integer categoryId);

    // Caută după preț
    List<HardwareDevice> findByPriceLessThanEqual(Double price);

    // Caută după brand
    List<HardwareDevice> findByBrandIgnoreCase(String brand);
}
