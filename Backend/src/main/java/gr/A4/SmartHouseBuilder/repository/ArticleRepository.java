package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByUserId(Long userId);

    Page<Article> findAll(Pageable pageable);

    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);

    List<Article> findByUserIdAndStatus(Long userId, ArticleStatus status);

    Page<Article> findByUserIdAndStatus(Long userId, ArticleStatus status, Pageable pageable);

    Optional<Article> findByIdAndUserId(Long id, Long userId);

    List<Article> findByStatus(ArticleStatus status);
}
