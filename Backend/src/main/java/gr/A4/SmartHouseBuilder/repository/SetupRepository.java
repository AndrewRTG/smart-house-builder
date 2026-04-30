package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SetupRepository extends JpaRepository<Setup, Long> {
    List<Setup> findByUserIdAndPublicSetupFalse(Long userId);

    Page<Setup> findByPublicSetupTrue(Pageable pageable);

    Optional<Setup> findByIdAndUserId(Long id, Long userId);

    List<Setup> findByUserIdAndStatus(Long userId, SetupStatus status);

    Page<Setup> findByUserIdAndStatus(Long userId, SetupStatus status, Pageable pageable);

    Page<Setup> findByPublicSetupTrueAndStatus(Pageable pageable, SetupStatus status);

    // --- Name uniqueness checks (case-insensitive, scoped to a single user) ---

    /** Used by createSetup and copySetup to reject duplicate names up-front. */
    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    /** Used by updateSetup so renaming to the same name you already have isn't a conflict. */
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long id);

    /**
     * Activity tab — "setups you copied": every setup this user owns whose
     * copiedFromId is set (meaning: they copied it from someone else).
     * Ordered newest first by createdAt.
     */
    java.util.List<Setup> findByUserIdAndCopiedFromIdIsNotNullOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);

    /** Activity tab — "setups you published": your PUBLISHED setups, newest-published first (updatedAt bumped on publish). */
    java.util.List<Setup> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, SetupStatus status, org.springframework.data.domain.Pageable pageable);
}
