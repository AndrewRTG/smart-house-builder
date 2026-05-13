package gr.A4.SmartHouseBuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(columnDefinition = "text")
    private String deviceIds;

    @Column(columnDefinition = "text")
    private String tags;

    /**
     * Lifecycle stage. Defaults to PUBLISHED at the DB level so the column
     * can be added to an existing `articles` table without breaking any
     * row (every pre-existing article was, by definition, published —
     * there were no drafts before this column existed).
     *
     * Why a String column and not a real ENUM type in Postgres: keeps the
     * migration trivial — Hibernate's ddl-auto=update can add a simple
     * VARCHAR column with a default and a NOT NULL constraint; introducing
     * a Postgres ENUM type would require manual SQL.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20) not null default 'PUBLISHED'")
    @Builder.Default
    private ArticleStatus status = ArticleStatus.PUBLISHED;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
