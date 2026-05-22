package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Optional<Wishlist> findByUserIdAndSetupId(Long userId, Long setupId);

    Page<Wishlist> findByUserId(Long userId, Pageable pageable);

    /** Activity tab: wishlist adds newest first. */
    java.util.List<Wishlist> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countBySetupId(Long setupId);

    void deleteByUserIdAndSetupId(Long userId, Long setupId);

    /**
     * Remove this setup from every user's wishlist. Called before the setup
     * itself is deleted, since wishlist.setup_id is a non-nullable FK.
     */
    @Modifying
    @Query("DELETE FROM Wishlist w WHERE w.setup.id = :setupId")
    void deleteAllBySetupId(@Param("setupId") Long setupId);

    //Pentru deviceuri
    Optional<Wishlist> findByUserIdAndDeviceId(Long userId, Integer deviceId);

    Page<Wishlist> findByUserIdAndDeviceIsNotNull(Long userId, Pageable pageable);

    long countByDeviceId(Integer deviceId);

    void deleteByUserIdAndDeviceId(Long userId, Integer deviceId);

    @Modifying
    @Query("DELETE FROM Wishlist w WHERE w.device.id = :deviceId")
    void deleteAllByDeviceId(@Param("deviceId") Integer deviceId);
}
