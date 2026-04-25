package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.Wishlist;
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
            return true;
        }
    }

    public Page<Wishlist> getUserWishlist(String email, Pageable pageable) {
        Long userId = getUserId(email);
        return wishlistRepository.findByUserId(userId, pageable);
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
}
