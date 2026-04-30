package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.ActivityItem;
import gr.A4.SmartHouseBuilder.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes the user's personal Activity feed — a merged, chronologically-
 * sorted list of their recent actions AND notifications-style items (people
 * commenting on their posts).
 *
 * This route requires authentication. SecurityConfig's default
 * .anyRequest().authenticated() covers it, so we don't need to list it in
 * the permitAll block.
 */
@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ActivityController {
    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<List<ActivityItem>> getMyActivity(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            // Matches the /auth/me null-check pattern: when JWT validation fails
            // silently for a permitAll route, we still want a clean 401 instead
            // of a 500 inside the service.
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(activityService.getActivity(userDetails.getUsername()));
    }
}
