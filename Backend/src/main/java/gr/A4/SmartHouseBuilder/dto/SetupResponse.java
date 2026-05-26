package gr.A4.SmartHouseBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetupResponse {
    private Long id;
    private String name;
    private String description;
    private List<Long> deviceIds;
    private boolean isPublic;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    /** Id of the setup this one was copied from, or null if it's an original. */
    private Long copiedFromId;

    // ---- Inline counters (added 2026-04-27 for the CommunityPage N+1 fix) -------
    // Without these, CommunityPage was firing one /like-count, one
    // /wishlist-count and one /comment-count GET PER setup it rendered.
    // For a 10-item page that's 30 extra round trips. They live here so a
    // single GET /api/v1/setups returns everything the feed needs.
    //
    // Builder.Default keeps existing call sites that don't set them safe —
    // they default to 0 instead of null, which the frontend can render
    // without an extra "?? 0".
    @lombok.Builder.Default private Long likeCount = 0L;
    @lombok.Builder.Default private Long wishlistCount = 0L;
    @lombok.Builder.Default private Long commentCount = 0L;

    // Author info — frontend needs this to render the avatar + username on
    // the card without joining /auth/me. Populated in SetupController.toResponse.
    private Long authorId;
    private String authorUsername;

    private List<String> tags;
    private String thumbnailUrl;
    private String canvasState;
    private int deviceCount;
    private String deviceSnapshots;
}
