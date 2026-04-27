package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findBySetupId(Long setupId, Pageable pageable);
    Page<Comment> findByArticleId(Long articleId, Pageable pageable);

    Page<Comment> findBySetupIdAndParentCommentIsNull(Long setupId, Pageable pageable);
    Page<Comment> findByArticleIdAndParentCommentIsNull(Long articleId, Pageable pageable);

    long countBySetupId(Long setupId);
    long countByArticleId(Long articleId);

    /** Used by ancestor-cleanup in soft-delete: how many replies does this stub still have? */
    long countByParentCommentId(Long parentCommentId);

    /**
     * Children of a given comment. Used by CommentService.deleteSubtree to walk
     * the tree post-order without relying on Comment.replies (which is no
     * longer cascade-fetched after we dropped CascadeType.ALL).
     */
    java.util.List<Comment> findByParentCommentId(Long parentCommentId);

    /** Activity tab: "your comments", most recent first. Covers both setup and article comments. */
    java.util.List<Comment> findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);

    /**
     * Activity tab (incoming): comments OTHER users posted on setups owned by
     * the given user, excluding self-comments. Uses JPQL because we need a
     * two-table condition (comment.setup.user.id AND comment.user.id).
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT c FROM Comment c WHERE c.setup.user.id = :ownerId AND c.user.id <> :ownerId AND c.deleted = false ORDER BY c.createdAt DESC")
    java.util.List<Comment> findIncomingOnMySetups(@org.springframework.data.repository.query.Param("ownerId") Long ownerId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query(
            "SELECT c FROM Comment c WHERE c.article.user.id = :ownerId AND c.user.id <> :ownerId AND c.deleted = false ORDER BY c.createdAt DESC")
    java.util.List<Comment> findIncomingOnMyArticles(@org.springframework.data.repository.query.Param("ownerId") Long ownerId, org.springframework.data.domain.Pageable pageable);

    /**
     * Used by the cascade-delete path in SetupService.deleteSetup. We fetch
     * ONLY the root comments (parent_comment_id IS NULL) and let the caller
     * delete them one by one. Hibernate's CascadeType.ALL + orphanRemoval on
     * Comment.replies then recursively removes every descendant reply for us.
     *
     * Why not a bulk JPQL "DELETE FROM Comment c WHERE c.setup.id = :id"?
     * Comments have a self-referencing FK (parent_comment_id -> id). A single
     * bulk DELETE evaluates FKs row-by-row, which can fail when Postgres
     * tries to remove a parent before its child has been removed. Going
     * through the ORM with cascade is slower but correct.
     */
    java.util.List<Comment> findBySetupIdAndParentCommentIsNull(Long setupId);
    java.util.List<Comment> findByArticleIdAndParentCommentIsNull(Long articleId);
}
