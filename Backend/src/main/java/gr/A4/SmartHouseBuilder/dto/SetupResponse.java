package gr.A4.SmartHouseBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetupResponse {
    private Long id;
    private String name;
    private String description;
    private List<Long> deviceIds;
    private boolean isPublic;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Id of the setup this one was copied from, or null if it's an original. */
    private Long copiedFromId;
}
