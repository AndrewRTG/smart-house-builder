package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Device;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.Wishlist;
import gr.A4.SmartHouseBuilder.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final SetupRepository setupRepository;
    private final DeviceRepository deviceRepository;
    private final NotificationService notificationService;
    private final ActivityEmailService activityEmailService;

    @Transactional
    public boolean toggleWishlist(Long setupId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Setup setup = setupRepository.findById(setupId)
                .orElseThrow(() -> new RuntimeException("Setup not found"));

        var existing = wishlistRepository.findByUserIdAndSetupId(user.getId(), setupId);

        if (existing.isPresent()) {
            wishlistRepository.deleteByUserIdAndSetupId(user.getId(), setupId);
            log.info("Setup removed from wishlist: {} by user: {}", setupId, email);
            return false;
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .setup(setup)
                    .build();
            wishlistRepository.save(wishlist);
            log.info("Setup added to wishlist: {} by user: {}", setupId, email);

            User setupOwner = setup.getUser();
            if (setupOwner != null && !setupOwner.getId().equals(user.getId())) {
                notificationService.triggerNotification(
                        setupOwner.getUsername(),
                        user.getUsername() + " saved your setup to their wishlist!"
                );
                activityEmailService.onWishlist(setupOwner, user.getUsername(), setup.getName());
            }

            return true;
        }
    }

    public Page<Wishlist> getUserWishlist(String email, Pageable pageable) {
        Long userId = getUserId(email);
        return wishlistRepository.findByUserIdAndSetupIsNotNull(userId, pageable);
    }

    public long getWishlistCount(Long setupId) {
        return wishlistRepository.countBySetupId(setupId);
    }

    public boolean isWishlisted(Long setupId, String email) {
        Long userId = getUserId(email);
        return wishlistRepository.findByUserIdAndSetupId(userId, setupId).isPresent();
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();
    }

    @Transactional
    public boolean toggleDeviceWishlist(Integer deviceId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        var existing = wishlistRepository.findByUserIdAndDeviceId(user.getId(), deviceId);

        if (existing.isPresent()) {
            wishlistRepository.deleteByUserIdAndDeviceId(user.getId(), deviceId);
            log.info("Device removed from wishlist: {} by user: {}", deviceId, email);
            return false;
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .device(device)
                    .build();
            wishlistRepository.save(wishlist);
            log.info("Device added to wishlist: {} by user: {}", deviceId, email);

            return true;
        }
    }

    public Page<Wishlist> getUserDeviceWishlist(String email, Pageable pageable) {
        Long userId = getUserId(email);
        return wishlistRepository.findByUserIdAndDeviceIsNotNull(userId, pageable);
    }

    public long getDeviceWishlistCount(Integer deviceId) {
        return wishlistRepository.countByDeviceId(deviceId);
    }

    public boolean isDeviceWishlisted(Integer deviceId, String email) {
        Long userId = getUserId(email);
        return wishlistRepository.findByUserIdAndDeviceId(userId, deviceId).isPresent();
    }
}
