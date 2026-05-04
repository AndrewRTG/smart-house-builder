package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.Layout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LayoutRepository extends JpaRepository<Layout, Integer> {
}