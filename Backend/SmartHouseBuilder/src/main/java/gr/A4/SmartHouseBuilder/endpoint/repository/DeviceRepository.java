package gr.A4.SmartHouseBuilder.endpoint.repository;

import gr.A4.SmartHouseBuilder.endpoint.entity.Device;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device,Integer> {

    @Query(value = "SELECT * FROM devices WHERE " +
            "(:categoryId IS NULL OR category_id = :categoryId) AND " +
            "(:brand IS NULL OR brand ILIKE CONCAT('%', CAST(:brand AS TEXT), '%')) AND " +
            "(:maxPrice IS NULL OR best_price <= :maxPrice)",
            nativeQuery = true)
    List<Device> findWithFilters(
            @Param("categoryId") Integer categoryId,
            @Param("brand") String brand,
            @Param("maxPrice") Double maxPrice
    );

    @Query(value = "SELECT * FROM devices WHERE " +
            "(:categoryId IS NULL OR category_id = :categoryId) AND " +
            "(:brand IS NULL OR brand ILIKE CONCAT('%', CAST(:brand AS TEXT), '%')) AND " +
            "(:maxPrice IS NULL OR best_price <= :maxPrice)",
            countQuery = "SELECT COUNT(*) FROM devices WHERE " +
                    "(:categoryId IS NULL OR category_id = :categoryId) AND " +
                    "(:brand IS NULL OR brand ILIKE CONCAT('%', CAST(:brand AS TEXT), '%')) AND " +
                    "(:maxPrice IS NULL OR best_price <= :maxPrice)",
            nativeQuery = true)
    Page<Device> findWithFiltersPageable(
            @Param("categoryId") Integer categoryId,
            @Param("brand") String brand,
            @Param("maxPrice") Double maxPrice,
            Pageable pageable
    );
}