package gr.A4.SmartHouseBuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "likes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_like_user_setup", columnNames = {"user_id", "setup_id"}),
    @UniqueConstraint(name = "uk_like_user_article", columnNames = {"user_id", "article_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Like {
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

    @CreationTimestamp
    private LocalDateTime createdAt;
}
