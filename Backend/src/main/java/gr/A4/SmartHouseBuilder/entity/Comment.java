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

    /*
     * `nullable = true` is intentional. The hybrid-delete strategy in
     * CommentService.deleteComment soft-deletes a comment WITH replies by
     * calling setUser(null) so the gravestone row no longer points at the
     * original author (privacy + UI shows a generic "User"). With the old
     * `nullable = false`, that save() would fail at flush time. We allow
     * NULL here and the service is the only place that ever writes it.
     */
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
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

    /*
     * IMPORTANT (2026-04-27 refactor): cascade and orphanRemoval REMOVED.
     *
     * The hybrid-delete strategy in CommentService.deleteComment is:
     *   - leaf comment (no active replies)  -> repository.delete (hard)
     *   - non-leaf                            -> setDeleted(true) (soft)
     *
     * With CascadeType.ALL still in place, a hard-delete on a non-leaf would
     * silently cascade-wipe every descendant reply, defeating the soft
     * delete. Worse, with orphanRemoval=true, simply CLEARING the in-memory
     * `replies` collection (which JPA does invisibly during merges) would
     * delete all those rows. Removing the cascade makes the lifecycle of
     * each Comment row explicit: only the service decides who lives.
     *
     * Side effects this triggers and how each is handled:
     *   1. SetupService.deleteSetup used to rely on the cascade to wipe a
     *      setup's whole comment tree when the setup itself is deleted.
     *      That now goes through CommentService.deleteCommentTreeForSetup
     *      which deletes leaves first, then parents, post-order — which
     *      respects the self-FK without needing cascade.
     *   2. ArticleService.deleteArticle had the SAME implicit dependency
     *      and the SAME fix: deleteCommentTreeForArticle.
     *   3. parent_comment_id at the DB level is left as ON DELETE NO ACTION
     *      because we never want a parent's removal to silently take its
     *      children with it. The service is the only path that touches the
     *      tree, and it walks bottom-up.
     */
    @OneToMany(mappedBy = "parentComment")
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
