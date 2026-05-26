package gr.A4.SmartHouseBuilder.team2.controller;

import gr.A4.SmartHouseBuilder.team2.dto.SetupBuildDTO;
import gr.A4.SmartHouseBuilder.team2.model.StoredLayout;
import gr.A4.SmartHouseBuilder.team2.service.LayoutPersistenceService;
import gr.A4.SmartHouseBuilder.team2.service.LayoutService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import gr.A4.SmartHouseBuilder.model.Layout;
import gr.A4.SmartHouseBuilder.repository.LayoutRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/team2/layouts")
public class LayoutController {

    private final LayoutService layoutService;
    private final LayoutPersistenceService layoutPersistenceService;
    private final UserRepository userRepository;
    private final LayoutRepository layoutRepository;

    public LayoutController(LayoutService layoutService,
                            LayoutPersistenceService layoutPersistenceService,
                            UserRepository userRepository,
                            LayoutRepository layoutRepository) {
        this.layoutService = layoutService;
        this.layoutPersistenceService = layoutPersistenceService;
        this.userRepository = userRepository;
        this.layoutRepository = layoutRepository;
    }


    @GetMapping("/{id}")
    public ResponseEntity<SetupBuildDTO> getLayoutById(@PathVariable Integer id) {
        return loadLayoutPayload(id);
    }

    @GetMapping("/open/{id}")
    public ResponseEntity<SetupBuildDTO> openLayout(@PathVariable Integer id) {
        return loadLayoutPayload(id);
    }

    private ResponseEntity<SetupBuildDTO> loadLayoutPayload(Integer id) {
        try {
            return layoutPersistenceService.loadAsJson(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<SetupBuildDTO> validateLayout(@RequestBody SetupBuildDTO data) {
        StoredLayout tmp = new StoredLayout();
        tmp.setContent(data);
        SetupBuildDTO validated = layoutService.validateLayout(tmp);
        return ResponseEntity.ok(validated);
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveLayout(@RequestBody SetupBuildDTO data, Authentication authentication) {
        StoredLayout tmp = new StoredLayout();
        tmp.setContent(data);
        SetupBuildDTO validated = layoutService.validateLayout(tmp);

        boolean hasBlocking = false;
        if (validated.getErrors() != null) {
            hasBlocking = validated.getErrors().stream()
                    .anyMatch(r -> r != null && !r.isValid() && "ERROR".equalsIgnoreCase(r.getLevel()));
        }
        if (hasBlocking) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "saved", false,
                    "errors", validated.getErrors()
            ));
        }

        Integer userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            if (email != null && !email.isBlank()) {
                userId = userRepository.findByEmail(email)
                        .map(u -> {
                            try {
                                return Math.toIntExact(u.getId());
                            } catch (ArithmeticException ex) {
                                return null;
                            }
                        })
                        .orElse(null);
            }
        }

        Integer id = layoutPersistenceService.saveAsJson(validated, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", id,
                "saved", true,
                "savedAt", Instant.now().toString()
        ));
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<byte[]> getLayoutThumbnail(@PathVariable Integer id) {
        return layoutRepository.findById(id)
                .map(Layout::getThumbnailPng)
                .filter(bytes -> bytes != null && bytes.length > 0)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                        .body(bytes))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-layouts")
    public ResponseEntity<List<Map<String, Object>>> getMyLayouts(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(user -> {
                    List<Layout> layouts = layoutRepository.findByUserId(Math.toIntExact(user.getId()));

                    List<Map<String, Object>> result = layouts.stream().map(l -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", l.getId());
                        return map;
                    }).collect(Collectors.toList());

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

}
