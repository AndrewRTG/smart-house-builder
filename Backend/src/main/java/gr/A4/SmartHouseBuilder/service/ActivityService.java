package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.ActivityItem;
import gr.A4.SmartHouseBuilder.entity.*;
import gr.A4.SmartHouseBuilder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Builds the user's Activity page feed. Each source (comments written,
 * comments received, setups published, setups copied, likes given, wishlist
 * added) is fetched independently and converted into a uniform ActivityItem,
 * then all items are merged and sorted newest-first.
 *
 * Each source is capped at {@link #PER_SOURCE_LIMIT} rows so a user with
 * 10,000 likes doesn't drown out everything else. The final merged feed is
 * also capped at {@link #FEED_LIMIT}. If either limit becomes a problem we
 * can paginate per-source later — for a personal activity page the single
 * "last 100 things you did" view is the right shape.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    /** Per-source cap. Enough that a typical user never hits it; low enough to keep the query cheap. */
    private static final int PER_SOURCE_LIMIT = 50;

    /** Total items in the merged feed, after sorting. */
    private static final int FEED_LIMIT = 100;

    /** Comment excerpt length for display; full content is fetched via the detail page. */
    private static final int EXCERPT_LENGTH = 120;

    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final SetupRepository setupRepository;
    private final LikeRepository likeRepository;
    private final WishlistRepository wishlistRepository;

    @Transactional(readOnly = true)
    public List<ActivityItem> getActivity(String email) {
        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();

        List<ActivityItem> items = new ArrayList<>();
        PageRequest limit = PageRequest.of(0, PER_SOURCE_LIMIT);

        // 1. Comments you wrote (setups + articles; shared entity handles both).
        commentRepository.findByUserIdOrderByCreatedAtDesc(userId, limit).forEach(c -> {
            ActivityItem item = commentToWroteItem(c);
            if (item != null) items.add(item);
        });

        // 2. Comments OTHERS wrote on YOUR posts (setups + articles separately
        //    because the ownership check lives on different relations).
        commentRepository.findIncomingOnMySetups(userId, limit).forEach(c ->
                items.add(commentToReceivedItem(c, "SETUP", c.getSetup().getId(), c.getSetup().getName())));
        commentRepository.findIncomingOnMyArticles(userId, limit).forEach(c ->
                items.add(commentToReceivedItem(c, "ARTICLE", c.getArticle().getId(), c.getArticle().getTitle())));

        // 3. Setups you PUBLISHED (updatedAt = publish time, since publishSetup bumps it).
        setupRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, SetupStatus.PUBLISHED, limit).forEach(s ->
                items.add(ActivityItem.builder()
                        .type("SETUP_PUBLISHED")
                        .timestamp(s.getUpdatedAt())
                        .targetType("SETUP")
                        .targetId(s.getId())
                        .targetTitle(s.getName())
                        .build()));

        // 4. Setups you COPIED (any of your setups with copiedFromId != null).
        setupRepository.findByUserIdAndCopiedFromIdIsNotNullOrderByCreatedAtDesc(userId, limit).forEach(s ->
                items.add(ActivityItem.builder()
                        .type("SETUP_COPIED")
                        .timestamp(s.getCreatedAt())
                        .targetType("SETUP")
                        .targetId(s.getId())
                        .targetTitle(s.getName())
                        .build()));

        // 5. Likes you gave (setup OR article — the row can point at either).
        likeRepository.findByUserIdOrderByCreatedAtDesc(userId, limit).forEach(l -> {
            ActivityItem item = likeToItem(l);
            if (item != null) items.add(item);
        });

        // 6. Wishlist saves (setups only, per schema — there's no wishlist.article_id column).
        wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId, limit).forEach(w -> {
            if (w.getSetup() != null) {
                items.add(ActivityItem.builder()
                        .type("WISHLIST_ADDED")
                        .timestamp(w.getCreatedAt())
                        .targetType("SETUP")
                        .targetId(w.getSetup().getId())
                        .targetTitle(w.getSetup().getName())
                        .build());
            }
        });

        // Merge + sort newest-first. Null timestamps (pathological) go to the end.
        items.sort(Comparator.comparing(
                ActivityItem::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));

        // Cap the merged feed.
        if (items.size() > FEED_LIMIT) {
            return items.subList(0, FEED_LIMIT);
        }
        return items;
    }

    /** Converts a comment YOU wrote into a COMMENT_WROTE item. Handles both setup and article targets. */
    private ActivityItem commentToWroteItem(Comment c) {
        // Deleted stubs shouldn't appear as your activity — there's nothing to
        // show and clicking them jumps to a "[deleted]" gravestone.
        if (c.isDeleted()) return null;

        String targetType;
        Long targetId;
        String targetTitle;
        if (c.getSetup() != null) {
            targetType = "SETUP";
            targetId = c.getSetup().getId();
            targetTitle = c.getSetup().getName();
        } else if (c.getArticle() != null) {
            targetType = "ARTICLE";
            targetId = c.getArticle().getId();
            targetTitle = c.getArticle().getTitle();
        } else {
            // Orphaned comment — skip it. Shouldn't happen in normal flow.
            return null;
        }

        return ActivityItem.builder()
                .type("COMMENT_WROTE")
                .timestamp(c.getCreatedAt())
                .targetType(targetType)
                .targetId(targetId)
                .targetTitle(targetTitle)
                .commentId(c.getId())
                .excerpt(excerpt(c.getContent()))
                .build();
    }

    /** Converts a comment SOMEONE ELSE wrote on your post into a COMMENT_RECEIVED item. */
    private ActivityItem commentToReceivedItem(Comment c, String targetType, Long targetId, String targetTitle) {
        return ActivityItem.builder()
                .type("COMMENT_RECEIVED")
                .timestamp(c.getCreatedAt())
                .targetType(targetType)
                .targetId(targetId)
                .targetTitle(targetTitle)
                .commentId(c.getId())
                .excerpt(excerpt(c.getContent()))
                .actorUsername(c.getUser() != null ? c.getUser().getUsername() : "User")
                .build();
    }

    /** Converts a Like row into a LIKE_GIVEN item. Like can target either a setup or an article. */
    private ActivityItem likeToItem(Like l) {
        if (l.getSetup() != null) {
            return ActivityItem.builder()
                    .type("LIKE_GIVEN")
                    .timestamp(l.getCreatedAt())
                    .targetType("SETUP")
                    .targetId(l.getSetup().getId())
                    .targetTitle(l.getSetup().getName())
                    .build();
        }
        if (l.getArticle() != null) {
            return ActivityItem.builder()
                    .type("LIKE_GIVEN")
                    .timestamp(l.getCreatedAt())
                    .targetType("ARTICLE")
                    .targetId(l.getArticle().getId())
                    .targetTitle(l.getArticle().getTitle())
                    .build();
        }
        return null;
    }

    /** Short, safe excerpt of comment content for the activity feed. */
    private String excerpt(String content) {
        if (content == null || content.isBlank()) return "";
        String trimmed = content.strip();
        return trimmed.length() <= EXCERPT_LENGTH
                ? trimmed
                : trimmed.substring(0, EXCERPT_LENGTH) + "…";
    }


}
