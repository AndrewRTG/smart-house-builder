package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.NotificationPreferenceDto;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<NotificationPreferenceDto> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        Long userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(preferenceService.getPreference(userId));
    }

    @PutMapping
    public ResponseEntity<NotificationPreferenceDto> updatePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NotificationPreferenceDto dto) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        Long userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(preferenceService.updatePreference(userId, dto));
    }

    private Long resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new UsernameNotFoundException(email));
    }
}
