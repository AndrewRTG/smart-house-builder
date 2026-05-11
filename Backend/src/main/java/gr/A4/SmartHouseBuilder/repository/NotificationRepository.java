package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {


    Page<Notification> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.username = :username AND n.isRead = false")
    void markAllAsReadByUsername(String username);
}