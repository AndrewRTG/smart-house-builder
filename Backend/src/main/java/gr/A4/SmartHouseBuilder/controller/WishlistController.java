package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.dto.DeviceWishlistResponse;
import gr.A4.SmartHouseBuilder.dto.WishlistResponse;
import gr.A4.SmartHouseBuilder.entity.Wishlist;
import gr.A4.SmartHouseBuilder.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WishlistController {
    private final WishlistService wishlistService;

    @PostMapping("/api/v1/setups/{setupId}/wishlist")
    public ResponseEntity<WishlistToggleResponse> toggleWishlist(
            @PathVariable Long setupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isWishlisted = wishlistService.toggleWishlist(setupId, userDetails.getUsername());
        return ResponseEntity.ok(WishlistToggleResponse.builder()
                .setupId(setupId)
                .isWishlisted(isWishlisted)
                .build());
    }

    @GetMapping("/api/v1/wishlists")
    public ResponseEntity<Page<WishlistResponse>> getUserWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Wishlist> wishlists = wishlistService.getUserWishlist(
                userDetails.getUsername(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(wishlists.map(w -> WishlistResponse.builder()
                .id(w.getId())
                .setupId(w.getSetup().getId())
                .setupName(w.getSetup().getName())
                .createdAt(w.getCreatedAt())
                .build()));
    }

    @GetMapping("/api/v1/setups/{setupId}/wishlist-count")
    public ResponseEntity<WishlistCountResponse> getWishlistCount(@PathVariable Long setupId) {
        long count = wishlistService.getWishlistCount(setupId);
        return ResponseEntity.ok(WishlistCountResponse.builder()
                .setupId(setupId)
                .count(count)
                .build());
    }

    @lombok.Data
    @lombok.Builder
    public static class WishlistToggleResponse {
        private Long setupId;
        private boolean isWishlisted;
    }

    @lombok.Data
    @lombok.Builder
    public static class WishlistCountResponse {
        private Long setupId;
        private long count;
    }

    //Pentru devices
    @PostMapping("/api/v1/devices/{deviceId}/wishlist")
    public ResponseEntity<Map<String, Object>> toggleDeviceWishlist(
            @PathVariable Integer deviceId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean isWishlisted = wishlistService.toggleDeviceWishlist(deviceId, userDetails.getUsername());
        long count = wishlistService.getDeviceWishlistCount(deviceId);

        Map<String, Object> response = new HashMap<>();
        response.put("deviceId", deviceId);
        response.put("isWishlisted", isWishlisted);
        response.put("wishlistCount", count);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/v1/wishlists/devices")
    public ResponseEntity<Page<DeviceWishlistResponse>> getUserDeviceWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Wishlist> wishlists = wishlistService.getUserDeviceWishlist(
                userDetails.getUsername(),
                PageRequest.of(page, size));

        return ResponseEntity.ok(wishlists.map(w -> DeviceWishlistResponse.builder()
                .id(w.getId())
                .deviceId(w.getDevice().getId())
                .deviceName(w.getDevice().getName())
                .deviceBrand(w.getDevice().getBrand())
                .deviceImageUrl(w.getDevice().getImageUrl())
                .deviceBestPrice(w.getDevice().getBestPrice())
                .createdAt(w.getCreatedAt())
                .build()));
    }

    @GetMapping("/api/v1/devices/{deviceId}/wishlist-count")
    public ResponseEntity<Map<String, Object>> getDeviceWishlistCount(@PathVariable Integer deviceId) {
        long count = wishlistService.getDeviceWishlistCount(deviceId);
        return ResponseEntity.ok(Map.of("deviceId", deviceId, "count", count));
    }
}
