package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class DynamicDeviceRepositoryImpl implements DynamicDeviceRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @SuppressWarnings("unchecked")
    public List<HardwareDevice> executeQuery(String sql) {
        return entityManager
                .createNativeQuery(sql, HardwareDevice.class)
                .getResultList();
    }
}