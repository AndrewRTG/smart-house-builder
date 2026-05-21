package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.entity.Wishlist;
import gr.A4.SmartHouseBuilder.entity.Device;
import gr.A4.SmartHouseBuilder.repository.DeviceRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.repository.WishlistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SetupRepository setupRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ActivityEmailService activityEmailService;

    @Mock
    private DeviceRepository deviceRepository;

    @InjectMocks
    private WishlistService wishlistService;

    @Test
    void toggleWishlist_removesExistingWishlistEntry() {
        User user = User.builder().id(1L).email("user@example.com").build();
        Setup setup = Setup.builder().id(11L).name("Setup").user(user).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(setupRepository.findById(11L)).thenReturn(Optional.of(setup));
        when(wishlistRepository.findByUserIdAndSetupId(1L, 11L)).thenReturn(Optional.of(new Wishlist()));

        boolean result = wishlistService.toggleWishlist(11L, "user@example.com");

        assertThat(result).isFalse();
        verify(wishlistRepository).deleteByUserIdAndSetupId(1L, 11L);
    }

    @Test
    void toggleWishlist_addsEntryWhenMissing() {
        User user = User.builder().id(1L).email("user@example.com").build();
        Setup setup = Setup.builder().id(11L).name("Setup").user(user).build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(setupRepository.findById(11L)).thenReturn(Optional.of(setup));
        when(wishlistRepository.findByUserIdAndSetupId(1L, 11L)).thenReturn(Optional.empty());

        boolean result = wishlistService.toggleWishlist(11L, "user@example.com");

        assertThat(result).isTrue();
        ArgumentCaptor<Wishlist> captor = ArgumentCaptor.forClass(Wishlist.class);
        verify(wishlistRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getSetup()).isEqualTo(setup);
    }

    @Test
    void toggleWishlist_triggersNotificationWhenOtherUserAdds() {
        User owner = User.builder().id(1L).email("owner@example.com").username("ownerUser").build();
        User adder = User.builder().id(2L).email("adder@example.com").username("adderUser").build();
        Setup setup = Setup.builder().id(11L).name("Cool Setup").user(owner).build();
        when(userRepository.findByEmail("adder@example.com")).thenReturn(Optional.of(adder));
        when(setupRepository.findById(11L)).thenReturn(Optional.of(setup));
        when(wishlistRepository.findByUserIdAndSetupId(2L, 11L)).thenReturn(Optional.empty());

        boolean result = wishlistService.toggleWishlist(11L, "adder@example.com");

        assertThat(result).isTrue();
        verify(notificationService).triggerNotification(eq("ownerUser"), anyString());
        verify(activityEmailService).onWishlist(eq(owner), eq("adderUser"), eq("Cool Setup"));
    }

    @Test
    void toggleWishlist_throwsWhenUserIsMissing() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.toggleWishlist(4L, "missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void getUserWishlist_usesResolvedUserId() {
        User user = User.builder().id(5L).email("user@example.com").build();
        var pageable = PageRequest.of(0, 10);
        var page = new PageImpl<>(List.of(new Wishlist()));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(wishlistRepository.findByUserId(5L, pageable)).thenReturn(page);

        var result = wishlistService.getUserWishlist("user@example.com", pageable);

        assertThat(result).isSameAs(page);
    }

    @Test
    void delegatesWishlistCountAndStateChecks() {
        User user = User.builder().id(5L).email("user@example.com").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(wishlistRepository.countBySetupId(12L)).thenReturn(8L);
        when(wishlistRepository.findByUserIdAndSetupId(5L, 12L)).thenReturn(Optional.of(new Wishlist()));

        assertThat(wishlistService.getWishlistCount(12L)).isEqualTo(8L);
        assertThat(wishlistService.isWishlisted(12L, "user@example.com")).isTrue();
    }

    @Test
    void toggleDeviceWishlist_removesExistingWishlistEntry() {
        User user = User.builder().id(1L).email("user@example.com").build();
        Device device = new Device();
        device.setId(100);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(deviceRepository.findById(100)).thenReturn(Optional.of(device));
        when(wishlistRepository.findByUserIdAndDeviceId(1L, 100)).thenReturn(Optional.of(new Wishlist()));

        boolean result = wishlistService.toggleDeviceWishlist(100, "user@example.com");

        assertThat(result).isFalse();
        verify(wishlistRepository).deleteByUserIdAndDeviceId(1L, 100);
    }

    @Test
    void toggleDeviceWishlist_addsEntryWhenMissing() {
        User user = User.builder().id(1L).email("user@example.com").build();
        Device device = new Device();
        device.setId(100);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(deviceRepository.findById(100)).thenReturn(Optional.of(device));
        when(wishlistRepository.findByUserIdAndDeviceId(1L, 100)).thenReturn(Optional.empty());

        boolean result = wishlistService.toggleDeviceWishlist(100, "user@example.com");

        assertThat(result).isTrue();
        ArgumentCaptor<Wishlist> captor = ArgumentCaptor.forClass(Wishlist.class);
        verify(wishlistRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getDevice()).isEqualTo(device);

        verifyNoInteractions(notificationService);
    }

    @Test
    void toggleDeviceWishlist_throwsWhenDeviceIsMissing() {
        User user = User.builder().id(1L).email("user@example.com").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(deviceRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.toggleDeviceWishlist(999, "user@example.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Device not found");
    }

    @Test
    void getUserDeviceWishlist_returnsPagedResults() {
        User user = User.builder().id(5L).email("user@example.com").build();
        var pageable = PageRequest.of(0, 10);
        var page = new PageImpl<>(List.of(new Wishlist()));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(wishlistRepository.findByUserIdAndDeviceIsNotNull(5L, pageable)).thenReturn(page);

        var result = wishlistService.getUserDeviceWishlist("user@example.com", pageable);

        assertThat(result).isSameAs(page);
    }

    @Test
    void delegatesDeviceWishlistCountAndStateChecks() {
        User user = User.builder().id(5L).email("user@example.com").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(wishlistRepository.countByDeviceId(100)).thenReturn(42L);
        when(wishlistRepository.findByUserIdAndDeviceId(5L, 100)).thenReturn(Optional.of(new Wishlist()));

        assertThat(wishlistService.getDeviceWishlistCount(100)).isEqualTo(42L);
        assertThat(wishlistService.isDeviceWishlisted(100, "user@example.com")).isTrue();
    }

}
