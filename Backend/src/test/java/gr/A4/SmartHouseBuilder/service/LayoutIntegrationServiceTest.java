package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.engine.CompatibilityEngine;
import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LayoutIntegrationServiceTest {

    @Mock
    private CompatibilityEngine compatibilityEngine;

    @InjectMocks
    private LayoutIntegrationService layoutIntegrationService;

    @Test
    void testIntegrateAndVerify_Success() {
        // GIVEN: Pregătim datele de intrare și comportamentul simulat al engine-ului
        SetupBuild build = new SetupBuild();
        ValidationResult mockResult1 = new ValidationResult();
        ValidationResult mockResult2 = new ValidationResult();

        // Când se apelează runAllChecks pe mock, returnăm o listă imutabilă (List.of)
        when(compatibilityEngine.runAllChecks(build)).thenReturn(List.of(mockResult1, mockResult2));

        // WHEN: Apelăm metoda din serviciu
        List<ValidationResult> results = layoutIntegrationService.integrateAndVerify(build);

        // THEN: Verificăm că rezultatul nu este null și conține elementele corecte
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.contains(mockResult1));
        assertTrue(results.contains(mockResult2));

        // Ne asigurăm că noua listă returnată este de tip modificabil (ArrayList)
        // încercând să adăugăm un element (opțional, dar validează logica "new ArrayList<>")
        assertDoesNotThrow(() -> results.add(new ValidationResult()));

        // Verificăm că metoda din CompatibilityEngine a fost apelată exact o dată cu parametrul corect
        verify(compatibilityEngine, times(1)).runAllChecks(build);
    }
}