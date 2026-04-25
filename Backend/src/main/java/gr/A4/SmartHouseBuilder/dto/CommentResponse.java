package gr.A4.SmartHouseBuilder.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long userId;
    private String username;
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * True when the currently-authenticated viewer is the author of this
     * comment. The frontend uses this flag to gate the red trash icon
     * (CommentsSection.jsx checks `comment.isOwner` before rendering it).
     *
     * The @JsonProperty annotation is REQUIRED here, and this is the bug
     * that was hiding the trash icon. Here's the chain:
     *
     *   1. Lombok's @Data on a `boolean` field named `isOwner` generates
     *      a getter called `isOwner()` (not `getIsOwner()` — Lombok sees
     *      the existing "is" prefix and doesn't double it up) and a
     *      setter called `setOwner()` (Lombok strips the "is" off the
     *      field name when forming the setter).
     *   2. Jackson, when serializing, looks at the getter `isOwner()`,
     *      strips the "is" prefix per JavaBeans conventions, and emits
     *      the JSON property as just `"owner"`.
     *   3. The frontend reads `comment.isOwner`, which is undefined,
     *      which is falsy, which hides the trash button.
     *
     * @JsonProperty("isOwner") locks the JSON name to "isOwner" so it
     * matches what the frontend already reads. No frontend changes
     * needed — this annotation alone fixes the trash icon.
     */
    @JsonProperty("isOwner")
    private boolean isOwner;

    private Long parentCommentId;

    @Builder.Default
    private List<CommentResponse> replies = List.of();

    /**
     * True when this comment was soft-deleted (its content was wiped but the
     * row survives because it has replies). The frontend uses this flag to:
     *   - draw the grey "U" avatar instead of the author's initial
     *   - display "User" instead of the author's username
     *   - hide the reply and delete buttons
     * When deleted=true, the server sets username="User", content="[deleted]",
     * and userId=null so the frontend doesn't need to duplicate that logic.
     */
    private boolean deleted;
}
