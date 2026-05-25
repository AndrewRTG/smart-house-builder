package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.Layout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LayoutRepository extends JpaRepository<Layout, Integer> {
    List<Layout> findByUserId(int intExact);
}
