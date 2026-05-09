package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Notification;
import gr.A4.SmartHouseBuilder.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }


    public Notification triggerNotification(String username, String message) {
        Notification notification = new Notification(username, message);
        return notificationRepository.save(notification);
    }


    public List<Notification> getAllUserNotifications(String username) {
        return notificationRepository.findByUsernameOrderByCreatedAtDesc(username);
    }

    public List<Notification> getUnreadUserNotifications(String username) {
        return notificationRepository.findByUsernameAndIsReadFalseOrderByCreatedAtDesc(username);
    }

    public void markAsRead(Long notificationId) {
        Optional<Notification> notifOpt = notificationRepository.findById(notificationId);
        if (notifOpt.isPresent()) {
            Notification notif = notifOpt.get();
            notif.setRead(true);
            notificationRepository.save(notif);
        }
    }
}