package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Notification;
import gr.A4.SmartHouseBuilder.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void triggerNotification(String username, String message) {
        Notification notification = new Notification(username, message);
        notificationRepository.save(notification);
    }


    public Page<Notification> getUserNotifications(String username, Pageable pageable) {
        return notificationRepository.findByUsernameOrderByCreatedAtDesc(username, pageable);
    }


    @Transactional
    public void markAsReadIfOwner(Long id, String loggedInUsername) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificarea nu a fost găsită"));

        if (!notification.getUsername().equals(loggedInUsername)) {
            throw new RuntimeException("Acces interzis: Nu poți modifica notificările altui user!");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public long countUnread(String username) {
        return notificationRepository.countByUsernameAndIsReadFalse(username);
    }

    @Transactional
    public void markAllAsRead(String username) {
        notificationRepository.markAllAsReadByUsername(username);
    }
}