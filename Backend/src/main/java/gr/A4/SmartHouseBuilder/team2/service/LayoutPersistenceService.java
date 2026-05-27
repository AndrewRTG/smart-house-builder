package gr.A4.SmartHouseBuilder.team2.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.model.Layout;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Optional;

@Service
public class LayoutPersistenceService {

    private static final int MAX_THUMBNAIL_BYTES = 6 * 1024 * 1024;

    private final LayoutRepository layoutRepository;
    private final ObjectMapper objectMapper;

    public LayoutPersistenceService(LayoutRepository layoutRepository, ObjectMapper objectMapper) {
        this.layoutRepository = layoutRepository;
        this.objectMapper = objectMapper;
    }

    public Integer saveAsJson(SetupBuildDTO dto) {
        return saveAsJson(dto, null);
    }

    public Integer saveAsJson(SetupBuildDTO dto, Integer userId) {
        byte[] thumbnail = extractThumbnailBytes(dto);

        final String json;
        try {
            dto.setThumbnailPngBase64(null);
            json = objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize layout payload to JSON", e);
        }

        Layout layout = new Layout();
        layout.setUserId(userId);
        layout.setDevicesId(null);
        layout.setDrawing(json);
        layout.setThumbnailPng(thumbnail);
        layout.setRating(null);
        return layoutRepository.save(layout).getId();
    }

    public Optional<SetupBuildDTO> loadAsJson(Integer layoutId) {
        return layoutRepository.findById(layoutId)
                .map(layout -> {
                    try {
                        return objectMapper.readValue(layout.getDrawing(), SetupBuildDTO.class);
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException("Failed to deserialize layout payload from JSON", e);
                    }
                });
    }

    private static byte[] extractThumbnailBytes(SetupBuildDTO dto) {
        String raw = dto.getThumbnailPngBase64();
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String b64 = raw.trim();
        int comma = b64.indexOf(',');
        if (comma >= 0 && b64.substring(0, comma).contains("base64")) {
            b64 = b64.substring(comma + 1);
        }
        b64 = b64.replaceAll("\\s", "");
        try {
            byte[] decoded = Base64.getDecoder().decode(b64);
            if (decoded.length > MAX_THUMBNAIL_BYTES) {
                return null;
            }
            return decoded;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
