package gr.A4.SmartHouseBuilder.endpoint.repository;

import gr.A4.SmartHouseBuilder.endpoint.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category,Integer> {
}
