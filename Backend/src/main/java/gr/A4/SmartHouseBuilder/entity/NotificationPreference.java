package gr.A4.SmartHouseBuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailOnComment = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailOnReply = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailOnLike = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailOnWishlist = false;
}
