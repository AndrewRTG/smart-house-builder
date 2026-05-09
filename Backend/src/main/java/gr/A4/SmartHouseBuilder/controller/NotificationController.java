package gr.A4.SmartHouseBuilder.controller;

import gr.A4.SmartHouseBuilder.entity.Notification;
import gr.A4.SmartHouseBuilder.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*") // Permite frontend-ului să acceseze API-ul
public class NotificationController {

    private final NotificationService notificationService;

    @Autowired
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }


    @GetMapping("/{username}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable String username) {
        return ResponseEntity.ok(notificationService.getAllUserNotifications(username));
    }


    @GetMapping("/{username}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable String username) {
        return ResponseEntity.ok(notificationService.getUnreadUserNotifications(username));
    }


    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}