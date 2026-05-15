package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends activity-triggered email notifications. Each method is async so that
 * an SMTP failure or slow delivery never blocks the user's request.
 *
 * Call-site contract: the caller must not notify a user about their own action
 * (e.g. do not call when the commenter is also the post owner).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityEmailService {

    private final EmailService emailService;
    private final NotificationPreferenceService preferenceService;

    @Async
    public void onComment(User owner, String actorUsername,
                          String targetTitle, String targetType, String excerpt) {
        if (!preferenceService.wantsEmail(owner.getId(), "COMMENT")) return;
        try {
            emailService.sendCommentNotificationEmail(
                    owner.getEmail(), actorUsername, targetTitle, targetType, excerpt);
        } catch (Exception e) {
            log.warn("Failed to send comment email to {}: {}", owner.getEmail(), e.getMessage());
        }
    }

    @Async
    public void onReply(User parentAuthor, String actorUsername,
                        String targetTitle, String targetType, String excerpt) {
        if (!preferenceService.wantsEmail(parentAuthor.getId(), "REPLY")) return;
        try {
            emailService.sendReplyNotificationEmail(
                    parentAuthor.getEmail(), actorUsername, targetTitle, targetType, excerpt);
        } catch (Exception e) {
            log.warn("Failed to send reply email to {}: {}", parentAuthor.getEmail(), e.getMessage());
        }
    }

    @Async
    public void onLike(User owner, String actorUsername, String targetTitle, String targetType) {
        if (!preferenceService.wantsEmail(owner.getId(), "LIKE")) return;
        try {
            emailService.sendLikeNotificationEmail(
                    owner.getEmail(), actorUsername, targetTitle, targetType);
        } catch (Exception e) {
            log.warn("Failed to send like email to {}: {}", owner.getEmail(), e.getMessage());
        }
    }

    @Async
    public void onWishlist(User owner, String actorUsername, String targetTitle) {
        if (!preferenceService.wantsEmail(owner.getId(), "WISHLIST")) return;
        try {
            emailService.sendWishlistNotificationEmail(
                    owner.getEmail(), actorUsername, targetTitle);
        } catch (Exception e) {
            log.warn("Failed to send wishlist email to {}: {}", owner.getEmail(), e.getMessage());
        }
    }
}
