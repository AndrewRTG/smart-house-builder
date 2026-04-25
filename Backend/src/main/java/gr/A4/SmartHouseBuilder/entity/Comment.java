package gr.A4.SmartHouseBuilder.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "setup_id")
    private Setup setup;

    @ManyToOne
    @JoinColumn(name = "article_id")
    private Article article;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "parent_comment_id")
    @JsonIgnore
    private Comment parentComment;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> replies;

    /**
     * True when the author deleted this comment AND it had replies we need to
     * keep around for thread structure. In that case the content is wiped,
     * the user reference is conceptually orphaned (we emit "User" in the
     * response regardless of who owned it), and the row stays as a
     * "[deleted]" gravestone so descendant replies still have a parent.
     *
     * Leaf comments (no replies) skip this entirely and get hard-deleted —
     * the '[deleted]' stub would just be noise with nothing under it.
     */
    /*
     * columnDefinition is what makes this safe to add to an existing comments
     * table. Without "default false", Hibernate emits:
     *     ALTER TABLE comments ADD COLUMN deleted BOOLEAN NOT NULL
     * which Postgres rejects, because every existing row would have NULL in
     * the new column, violating NOT NULL. With "default false" it emits:
     *     ALTER TABLE comments ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false
     * Postgres backfills every existing row to false in one shot, then the
     * NOT NULL constraint is satisfied. New rows still default to false at
     * the Java level (the @Builder.Default + primitive `boolean` field).
     */
    @Column(nullable = false, columnDefinition = "boolean not null default false")
    @Builder.Default
    private boolean deleted = false;
}
