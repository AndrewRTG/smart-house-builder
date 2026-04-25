package gr.A4.SmartHouseBuilder.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.CopySetupRequest;
import gr.A4.SmartHouseBuilder.dto.SetupRequest;
import gr.A4.SmartHouseBuilder.dto.SetupResponse;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.service.SetupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/setups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SetupController {
    private final SetupService setupService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<SetupResponse> createSetup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SetupRequest request) {
        Setup setup = setupService.createSetup(userDetails.getUsername(), request);
        return ResponseEntity.status(201).body(toResponse(setup));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SetupResponse> getSetup(@PathVariable Long id) {
        Setup setup = setupService.getSetup(id);
        return ResponseEntity.ok(toResponse(setup));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SetupResponse> updateSetup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SetupRequest request) {
        Setup setup = setupService.updateSetup(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(toResponse(setup));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSetup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        setupService.deleteSetup(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<SetupResponse> copySetup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CopySetupRequest request) {
        Setup setup = setupService.copySetup(id, userDetails.getUsername(), request.getName());
        return ResponseEntity.status(201).body(toResponse(setup));
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<SetupResponse> publishSetup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Setup setup = setupService.publishSetup(id, userDetails.getUsername());
        return ResponseEntity.ok(toResponse(setup));
    }

    @GetMapping
    public ResponseEntity<Page<SetupResponse>> getPublicSetups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Setup> setups = setupService.getPublicSetups(PageRequest.of(page, size));
        return ResponseEntity.ok(setups.map(this::toResponse));
    }

    @GetMapping("/user/my-setups")
    public ResponseEntity<List<SetupResponse>> getUserSetups(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Setup> setups = setupService.getUserSetups(userDetails.getUsername());
        return ResponseEntity.ok(setups.stream().map(this::toResponse).toList());
    }

    @GetMapping("/user/drafts")
    public ResponseEntity<Page<SetupResponse>> getUserDrafts(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        Page<Setup> setups = setupService.getUserDrafts(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(setups.map(this::toResponse));
    }

    @GetMapping("/user/published")
    public ResponseEntity<Page<SetupResponse>> getUserPublished(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        Page<Setup> setups = setupService.getUserPublished(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(setups.map(this::toResponse));
    }

    private SetupResponse toResponse(Setup setup) {
        return SetupResponse.builder()
                .id(setup.getId())
                .name(setup.getName())
                .description(setup.getDescription())
                .deviceIds(deserializeDeviceIds(setup.getDeviceIds()))
                .isPublic(setup.isPublicSetup())
                .status(setup.getStatus().toString())
                .createdAt(setup.getCreatedAt())
                .updatedAt(setup.getUpdatedAt())
                .copiedFromId(setup.getCopiedFromId())
                .build();
    }

    private List<Long> deserializeDeviceIds(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
