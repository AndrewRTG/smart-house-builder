package gr.A4.SmartHouseBuilder.endpoint.repository;

import gr.A4.SmartHouseBuilder.endpoint.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device,Integer> {
    @Query(value = "SELECT * FROM devices WHERE " +
            "(:categoryId IS NULL OR category_id = :categoryId) AND " +
            "(:brand IS NULL OR (brand ILIKE CONCAT('%', CAST(:brand AS TEXT), '%') " +
            "OR similarity(LOWER(brand), LOWER(CAST(:brand AS TEXT))) > 0.3)) AND " +
            "(:maxPrice IS NULL OR best_price <= :maxPrice)",
            nativeQuery = true)
    List<Device> findWithFilters(
            @Param("categoryId") Integer categoryId,
            @Param("brand") String brand,
            @Param("maxPrice") Double maxPrice
    );
    @Query(value = """
            SELECT name FROM devices 
            WHERE similarity(LOWER(name), LOWER(:keyword)) > 0.2
            ORDER BY LOWER(name) <-> LOWER(:keyword) ASC 
            LIMIT 1
            """, nativeQuery = true)
    String findDidYouMeanSuggestion(@Param("keyword") String keyword);
}
