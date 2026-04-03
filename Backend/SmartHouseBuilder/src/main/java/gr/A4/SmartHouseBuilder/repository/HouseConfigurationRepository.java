package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.HouseConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HouseConfigurationRepository extends JpaRepository<HouseConfiguration, Long> {
}