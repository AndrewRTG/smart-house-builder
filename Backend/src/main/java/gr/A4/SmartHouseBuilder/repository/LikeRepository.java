package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndSetupId(Long userId, Long setupId);
    Optional<Like> findByUserIdAndArticleId(Long userId, Long articleId);

    void deleteByUserIdAndSetupId(Long userId, Long setupId);
    void deleteByUserIdAndArticleId(Long userId, Long articleId);

    long countBySetupId(Long setupId);
    long countByArticleId(Long articleId);

    /** Activity tab: every like this user has given (setup or article), newest first. */
    java.util.List<Like> findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);

    /**
     * Wipe every like row for a setup. Used when the setup itself is being
     * deleted — without this, the FK constraint on likes.setup_id rejects
     * the parent delete.
     */
    @Modifying
    @Query("DELETE FROM Like l WHERE l.setup.id = :setupId")
    void deleteAllBySetupId(@Param("setupId") Long setupId);

    /**
     * Twin of deleteAllBySetupId for articles. Required by ArticleService.deleteArticle —
     * without it, deleting an article that has even one like throws a FK
     * violation on likes.article_id.
     */
    @Modifying
    @Query("DELETE FROM Like l WHERE l.article.id = :articleId")
    void deleteAllByArticleId(@Param("articleId") Long articleId);
}
