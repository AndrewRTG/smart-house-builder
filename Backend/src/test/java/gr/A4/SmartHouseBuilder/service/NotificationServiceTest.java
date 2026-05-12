package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Notification;
import gr.A4.SmartHouseBuilder.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void triggerNotification_createsUnreadNotification() {
        notificationService.triggerNotification("john", "New article");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("john");
        assertThat(captor.getValue().getMessage()).isEqualTo("New article");
        assertThat(captor.getValue().isRead()).isFalse();
    }

    @Test
    void getUserNotifications_delegatesToRepository() {
        var pageable = PageRequest.of(0, 10);
        var expected = new PageImpl<>(List.of(new Notification("john", "hello")));
        when(notificationRepository.findByUsernameOrderByCreatedAtDesc("john", pageable)).thenReturn(expected);

        var result = notificationService.getUserNotifications("john", pageable);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void markAsReadIfOwner_marksNotificationAsRead() {
        Notification notification = new Notification("john", "hello");
        notification.setId(5L);
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(notification));

        notificationService.markAsReadIfOwner(5L, "john");

        assertThat(notification.isRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsReadIfOwner_throwsForDifferentOwner() {
        Notification notification = new Notification("john", "hello");
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsReadIfOwner(5L, "jane"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Acces interzis");
    }

    @Test
    void markAsReadIfOwner_throwsWhenNotificationIsMissing() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsReadIfOwner(99L, "john"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Notificarea");
    }

    @Test
    void markAllAsRead_delegatesToRepository() {
        notificationService.markAllAsRead("john");

        verify(notificationRepository).markAllAsReadByUsername("john");
    }
}
