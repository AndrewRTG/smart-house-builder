package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.ActivityItem;
import gr.A4.SmartHouseBuilder.entity.*;
import gr.A4.SmartHouseBuilder.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private SetupRepository setupRepository;

    @Mock
    private LikeRepository likeRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    @InjectMocks
    private ActivityService activityService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("test@example.com");
        mockUser.setUsername("tester");
    }

    @Test
    void getActivity_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> activityService.getActivity("notfound@example.com"));
    }

    @Test
    void getActivity_ReturnsSortedActivityItems() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));

        Setup mockSetup = new Setup();
        mockSetup.setId(10L);
        mockSetup.setName("Test Setup");
        mockSetup.setUpdatedAt(LocalDateTime.now().minusDays(1));
        mockSetup.setCreatedAt(LocalDateTime.now().minusDays(2));

        when(setupRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(
                eq(1L), eq(SetupStatus.PUBLISHED), any(PageRequest.class)))
                .thenReturn(List.of(mockSetup));

        Like mockLike = new Like();
        mockLike.setId(100L);
        mockLike.setSetup(mockSetup);
        mockLike.setCreatedAt(LocalDateTime.now());

        when(likeRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(mockLike));

        Comment mockComment = new Comment();
        mockComment.setId(50L);
        mockComment.setContent("Test comment content");
        mockComment.setSetup(mockSetup);
        mockComment.setCreatedAt(LocalDateTime.now().minusDays(5));
        mockComment.setDeleted(false);

        when(commentRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(mockComment));

        List<ActivityItem> result = activityService.getActivity("test@example.com");

        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals("LIKE_GIVEN", result.get(0).getType());
        assertEquals("SETUP_PUBLISHED", result.get(1).getType());
        assertEquals("COMMENT_WROTE", result.get(2).getType());
    }
}