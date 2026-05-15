package gr.A4.SmartHouseBuilder.repository;


import gr.A4.SmartHouseBuilder.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory,Integer> {
    @Query(value = """
        SELECT * FROM price_history
        WHERE id = (
            SELECT id FROM (
                SELECT DISTINCT ON (store_name) id, price
                FROM price_history
                WHERE device_id = :deviceId
                ORDER BY store_name, scraped_at DESC
            ) as latest_prices
            ORDER BY price ASC
            LIMIT 1
        )
        """, nativeQuery = true)
    Optional<PriceHistory> findCheapestCurrentRecord(@Param("deviceId") Integer deviceId);
}
