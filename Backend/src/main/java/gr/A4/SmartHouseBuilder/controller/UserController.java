package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.UserProfileResponse;
import gr.A4.SmartHouseBuilder.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final AuthService authService;

    @PutMapping("/username")
    public ResponseEntity<UserProfileResponse> updateUsername(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(authService.updateUsername(userDetails.getUsername(), request.get("newUsername")));
        } catch (Exception e) {
            return ResponseEntity.status(400).build();
        }
    }

    @PutMapping("/email")
    public ResponseEntity<UserProfileResponse> updateEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(authService.updateEmail(userDetails.getUsername(), request.get("newEmail")));
        } catch (Exception e) {
            return ResponseEntity.status(400).build();
        }
    }

    @PostMapping("/mfa/toggle")
    public ResponseEntity<UserProfileResponse> toggleMfa(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.toggleMfa(userDetails.getUsername()));
    }
}
