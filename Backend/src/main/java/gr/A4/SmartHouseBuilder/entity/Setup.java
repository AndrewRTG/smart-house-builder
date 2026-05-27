package gr.A4.SmartHouseBuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "setups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Setup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(columnDefinition = "text")
    private String deviceIds;

    @Column(nullable = false)
    @Builder.Default
    private boolean publicSetup = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SetupStatus status = SetupStatus.DRAFT;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /** Set ONCE when the setup transitions from DRAFT to PUBLISHED. */
    private LocalDateTime publishedAt;

    @Column(columnDefinition = "text")
    private String tags;

    @Column(columnDefinition = "text")
    private String thumbnailUrl;

    /** Full canvas state JSON ({lines, placedIcons, placedFurniture}) for builder resume. */
    @Column(columnDefinition = "text")
    private String canvasState;

    /** JSON snapshot of devices used: [{id, name, brand, priceEUR, type}, ...]. */
    @Column(columnDefinition = "text")
    private String deviceSnapshots;

    // ---- Copy lineage (null when this setup is an original) ----

    /**
     * The setup this one was copied from. Null for originals.
     * We keep this as a soft FK (Long) rather than a @ManyToOne so deleting the
     * source setup does not cascade-break copies. The publish-unchanged guard
     * uses the SNAPSHOT fields below, not a live lookup of this FK, so the
     * original can change or vanish without loosening validation.
     */
    @Column(name = "copied_from_id")
    private Long copiedFromId;

    /**
     * Snapshot of the source setup's deviceIds string at copy time. Compared
     * (as a set) against the current deviceIds when the user tries to publish.
     * If they match AND originalDescription matches, we block the publish —
     * the user must actually modify something before publishing a copy.
     *
     * This is how we prevent the "remove and re-add the same device" bypass:
     * the comparison is set-based against a frozen snapshot, not differential.
     */
    @Column(name = "original_device_ids", columnDefinition = "text")
    private String originalDeviceIds;

    /**
     * Snapshot of the source setup's description at copy time. See
     * originalDeviceIds for the rationale.
     */
    @Column(name = "original_description", columnDefinition = "text")
    private String originalDescription;
}
