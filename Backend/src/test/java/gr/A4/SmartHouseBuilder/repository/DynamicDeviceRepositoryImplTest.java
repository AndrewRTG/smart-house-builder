package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.model.HardwareDevice;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DynamicDeviceRepositoryImplTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @InjectMocks
    private DynamicDeviceRepositoryImpl dynamicDeviceRepository;

    @Test
    void testExecuteQuery_Success() {
        // GIVEN
        String sql = "SELECT * FROM devices WHERE price < 100";
        HardwareDevice device = new HardwareDevice();
        device.setId(1L);
        device.setName("Test Device");

        List<HardwareDevice> expectedList = List.of(device);

        // Simulăm comportamentul în lanț al EntityManager-ului
        // 1. createNativeQuery returnează un obiect de tip Query
        when(entityManager.createNativeQuery(sql, HardwareDevice.class)).thenReturn(query);
        // 2. getResultList returnează lista noastră de test
        when(query.getResultList()).thenReturn(expectedList);

        // WHEN
        List<HardwareDevice> result = dynamicDeviceRepository.executeQuery(sql);

        // THEN
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Device", result.get(0).getName());

        // Verificăm dacă metodele au fost apelate cu parametrii corecți
        verify(entityManager, times(1)).createNativeQuery(sql, HardwareDevice.class);
        verify(query, times(1)).getResultList();
    }

    @Test
    void testExecuteQuery_EmptyResult() {
        // GIVEN
        String sql = "SELECT * FROM devices WHERE name = 'NonExistent'";
        when(entityManager.createNativeQuery(anyString(), eq(HardwareDevice.class))).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());

        // WHEN
        List<HardwareDevice> result = dynamicDeviceRepository.executeQuery(sql);

        // THEN
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}