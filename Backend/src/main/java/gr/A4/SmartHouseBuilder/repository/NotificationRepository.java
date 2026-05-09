package gr.A4.SmartHouseBuilder.repository;

import gr.A4.SmartHouseBuilder.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {


    List<Notification> findByUsernameOrderByCreatedAtDesc(String username);


    List<Notification> findByUsernameAndIsReadFalseOrderByCreatedAtDesc(String username);
}