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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
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

        lenient().when(commentRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of());
        lenient().when(commentRepository.findIncomingOnMySetups(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of());
        lenient().when(commentRepository.findIncomingOnMyArticles(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of());
        lenient().when(setupRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(
                eq(1L), eq(SetupStatus.PUBLISHED), any(PageRequest.class)))
                .thenReturn(List.of());
        lenient().when(setupRepository.findByUserIdAndCopiedFromIdIsNotNullOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of());
        lenient().when(likeRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of());
        lenient().when(wishlistRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of());
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

    @Test
    void getActivity_IncludesAllSupportedSourcesAndSkipsInvalidRows() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));
        LocalDateTime now = LocalDateTime.of(2026, 5, 13, 12, 0);

        Setup setup = new Setup();
        setup.setId(10L);
        setup.setName("Published setup");
        setup.setUpdatedAt(now.minusHours(5));
        setup.setCreatedAt(now.minusDays(3));

        Setup copiedSetup = new Setup();
        copiedSetup.setId(11L);
        copiedSetup.setName("Copied setup");
        copiedSetup.setCreatedAt(now.minusHours(3));

        Article article = Article.builder()
                .id(20L)
                .title("Matter article")
                .user(mockUser)
                .build();

        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("alex");

        Comment wroteOnArticle = Comment.builder()
                .id(101L)
                .article(article)
                .content("  " + "x".repeat(125))
                .createdAt(now.minusHours(1))
                .deleted(false)
                .build();
        Comment deletedComment = Comment.builder()
                .id(102L)
                .setup(setup)
                .content("hidden")
                .createdAt(now.minusMinutes(10))
                .deleted(true)
                .build();
        Comment orphanComment = Comment.builder()
                .id(103L)
                .content("orphan")
                .createdAt(now.minusMinutes(9))
                .deleted(false)
                .build();
        Comment incomingSetup = Comment.builder()
                .id(104L)
                .setup(setup)
                .user(otherUser)
                .content("Nice setup")
                .createdAt(now.minusHours(2))
                .build();
        Comment incomingArticle = Comment.builder()
                .id(105L)
                .article(article)
                .content(null)
                .createdAt(now.minusHours(4))
                .build();

        Like articleLike = Like.builder()
                .id(201L)
                .article(article)
                .createdAt(now.minusMinutes(30))
                .build();
        Like orphanLike = Like.builder()
                .id(202L)
                .createdAt(now.minusMinutes(20))
                .build();

        Wishlist wishlist = Wishlist.builder()
                .id(301L)
                .setup(setup)
                .createdAt(now.minusMinutes(45))
                .build();
        Wishlist emptyWishlist = Wishlist.builder()
                .id(302L)
                .createdAt(now.minusMinutes(40))
                .build();

        when(commentRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(wroteOnArticle, deletedComment, orphanComment));
        when(commentRepository.findIncomingOnMySetups(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(incomingSetup));
        when(commentRepository.findIncomingOnMyArticles(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(incomingArticle));
        when(setupRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(
                eq(1L), eq(SetupStatus.PUBLISHED), any(PageRequest.class)))
                .thenReturn(List.of(setup));
        when(setupRepository.findByUserIdAndCopiedFromIdIsNotNullOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(copiedSetup));
        when(likeRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(articleLike, orphanLike));
        when(wishlistRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(List.of(wishlist, emptyWishlist));

        List<ActivityItem> result = activityService.getActivity("test@example.com");

        assertEquals(7, result.size());
        assertTrue(result.stream().noneMatch(item -> item.getCommentId() != null && item.getCommentId().equals(102L)));
        assertTrue(result.stream().noneMatch(item -> item.getCommentId() != null && item.getCommentId().equals(103L)));
        assertTrue(result.stream().anyMatch(item ->
                "COMMENT_WROTE".equals(item.getType())
                        && "ARTICLE".equals(item.getTargetType())
                        && item.getExcerpt().length() > 120
                        && item.getExcerpt().startsWith("x")));
        assertTrue(result.stream().anyMatch(item ->
                "COMMENT_RECEIVED".equals(item.getType())
                        && "alex".equals(item.getActorUsername())
                        && "Nice setup".equals(item.getExcerpt())));
        assertTrue(result.stream().anyMatch(item ->
                "COMMENT_RECEIVED".equals(item.getType())
                        && "User".equals(item.getActorUsername())
                        && "".equals(item.getExcerpt())));
        assertTrue(result.stream().anyMatch(item -> "SETUP_COPIED".equals(item.getType())));
        assertTrue(result.stream().anyMatch(item ->
                "LIKE_GIVEN".equals(item.getType()) && "ARTICLE".equals(item.getTargetType())));
        assertTrue(result.stream().anyMatch(item -> "WISHLIST_ADDED".equals(item.getType())));
    }

    @Test
    void getActivity_CapsMergedFeedAtOneHundredItems() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));
        LocalDateTime now = LocalDateTime.of(2026, 5, 13, 12, 0);
        List<Setup> publishedSetups = new ArrayList<>();
        List<Setup> copiedSetups = new ArrayList<>();
        List<Like> likes = new ArrayList<>();

        IntStream.range(0, 45).forEach(i -> {
            Setup setup = new Setup();
            setup.setId((long) i);
            setup.setName("Setup " + i);
            setup.setUpdatedAt(now.minusMinutes(i));
            setup.setCreatedAt(now.minusMinutes(i + 60));
            publishedSetups.add(setup);
        });
        IntStream.range(45, 90).forEach(i -> {
            Setup setup = new Setup();
            setup.setId((long) i);
            setup.setName("Copied " + i);
            setup.setCreatedAt(now.minusMinutes(i));
            copiedSetups.add(setup);
        });
        IntStream.range(90, 125).forEach(i -> {
            Setup setup = new Setup();
            setup.setId((long) i);
            setup.setName("Liked " + i);
            likes.add(Like.builder()
                    .id((long) i)
                    .setup(setup)
                    .createdAt(now.minusMinutes(i))
                    .build());
        });

        when(setupRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(
                eq(1L), eq(SetupStatus.PUBLISHED), any(PageRequest.class)))
                .thenReturn(publishedSetups);
        when(setupRepository.findByUserIdAndCopiedFromIdIsNotNullOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(copiedSetups);
        when(likeRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                .thenReturn(likes);

        List<ActivityItem> result = activityService.getActivity("test@example.com");

        assertEquals(100, result.size());
        assertEquals("SETUP_PUBLISHED", result.get(0).getType());
        assertTrue(result.get(0).getTimestamp().isAfter(result.get(99).getTimestamp()));
    }
}
