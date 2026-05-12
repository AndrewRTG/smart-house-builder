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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LayoutIntegrationServiceTest {

    @Mock
    private CompatibilityEngine compatibilityEngine;

    @InjectMocks
    private LayoutIntegrationService layoutIntegrationService;

    @Test
    void integrateAndVerify_returnsACopyOfCompatibilityResults() {
        SetupBuild build = new SetupBuild();
        List<ValidationResult> engineResults = List.of(
                new ValidationResult(true, "info", "ok")
        );
        when(compatibilityEngine.runAllChecks(build)).thenReturn(engineResults);

        var result = layoutIntegrationService.integrateAndVerify(build);

        assertThat(result).containsExactlyElementsOf(engineResults);
        assertThat(result).isNotSameAs(engineResults);
    }
}
