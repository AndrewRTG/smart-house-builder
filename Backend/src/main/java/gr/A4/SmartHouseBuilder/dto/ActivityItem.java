package gr.A4.SmartHouseBuilder.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One row on the user's Activity page. The 'type' discriminator tells the
 * frontend which icon and phrasing to use; every other field is optional and
 * only populated for the activity types that need it.
 *
 * Types (string values, kept in sync with the frontend switch):
 *   - COMMENT_WROTE          — you commented on something
 *   - COMMENT_RECEIVED       — someone commented on a post of yours
 *   - SETUP_PUBLISHED        — you published a setup
 *   - SETUP_COPIED           — you copied someone's public setup into your drafts
 *   - LIKE_GIVEN             — you liked a setup or article
 *   - WISHLIST_ADDED         — you saved a setup to your wishlist
 *
 * The frontend uses (targetType, targetId) to build the navigation URL
 * (/setups/{id} or /articles/{id}), and commentId (when present) to jump to
 * and highlight a specific comment via the detail page's ?comment= param.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityItem {
    /** Discriminator — see class javadoc for valid values. */
    private String type;

    /** When this activity happened. Used for sorting and display. */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    /** "SETUP" or "ARTICLE" — tells the frontend which detail route to use. */
    private String targetType;

    /** Id of the setup or article this activity refers to. */
    private Long targetId;

    /** Display title of the setup/article, so we can show "on <title>" without another fetch. */
    private String targetTitle;

    /** For comment-type activities: the comment id, so the detail page can scroll-highlight it. */
    private Long commentId;

    /** For comment-type activities: a short excerpt (first ~120 chars, deleted -> "[deleted]"). */
    private String excerpt;

    /**
     * For COMMENT_RECEIVED: the username of the person who commented on your post.
     * For other types this is null.
     */
    private String actorUsername;
}
