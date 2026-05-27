package gr.A4.SmartHouseBuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "setup_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wishlist {
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
    @JoinColumn(name = "device_id")
    private Device device;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
