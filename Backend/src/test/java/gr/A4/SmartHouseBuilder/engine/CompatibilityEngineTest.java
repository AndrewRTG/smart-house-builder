package gr.A4.SmartHouseBuilder.engine;

import gr.A4.SmartHouseBuilder.model.SetupBuild;
import gr.A4.SmartHouseBuilder.model.ValidationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CompatibilityEngineTest {

    private CompatibilityEngine compatibilityEngine;

    @BeforeEach
    void setUp() {
        compatibilityEngine = new CompatibilityEngine();
    }

    @Test
    void testRunAllChecks_Success() {
        // GIVEN
        SetupBuild build = new SetupBuild();
        // Aici poți seta proprietăți pe build dacă regulile tale (EcosystemMatchRule etc.)
        // au nevoie de date specifice pentru a nu da NullPointerException intern

        // WHEN
        List<ValidationResult> results = compatibilityEngine.runAllChecks(build);

        // THEN
        assertNotNull(results);
        // Deoarece ai 2 reguli instantiate în listă, ar trebui să avem 2 rezultate
        assertEquals(2, results.size());
    }

    @Test
    void testRunAllChecks_NullBuild() {
        // GIVEN: Forțăm ramura de build == null
        // WHEN
        List<ValidationResult> results = compatibilityEngine.runAllChecks(null);

        // THEN
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }
}