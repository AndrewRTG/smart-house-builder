package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Device;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device,Integer> {
    @Query(value = "SELECT * FROM devices WHERE " +
            "(:#{#categoryIds == null || #categoryIds.isEmpty()} = true OR category_id IN (:categoryIds)) AND " +
            "(CAST(:brand AS TEXT) IS NULL OR (brand ILIKE CONCAT('%', CAST(:brand AS TEXT), '%') " +
            "OR similarity(LOWER(brand), LOWER(CAST(:brand AS TEXT))) > 0.3)) AND " +
            "(CAST(:maxPrice AS NUMERIC) IS NULL OR best_price <= :maxPrice) AND " +
            "(CAST(:minPrice AS NUMERIC) IS NULL OR best_price >= :minPrice) AND " +
            "(:#{#protocols == null || #protocols.isEmpty()} = true OR communication_protocol IN (:protocols))",
            nativeQuery = true)
    List<Device> findWithFilters(
            @Param("categoryIds") List<Integer> categoryIds,
            @Param("brand") String brand,
            @Param("maxPrice") Double maxPrice,
            @Param("minPrice") Double minPrice,
            @Param("protocols") List<String> protocols,
            Sort sort
    );
    @Query(value = """
            SELECT name FROM devices 
            WHERE similarity(LOWER(name), LOWER(:keyword)) > 0.2
            ORDER BY LOWER(name) <-> LOWER(:keyword) ASC 
            LIMIT 1
            """, nativeQuery = true)
    String findDidYouMeanSuggestion(@Param("keyword") String keyword);
    Optional<Device> findByName(String name);
}
