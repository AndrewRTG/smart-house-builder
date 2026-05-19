package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.NotificationPreferenceDto;
import gr.A4.SmartHouseBuilder.entity.NotificationPreference;
import gr.A4.SmartHouseBuilder.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    @Transactional(readOnly = true)
    public NotificationPreferenceDto getPreference(Long userId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> defaultPreference(userId));
        return toDto(pref);
    }

    @Transactional
    public NotificationPreferenceDto updatePreference(Long userId, NotificationPreferenceDto dto) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> defaultPreference(userId));
        pref.setEmailOnComment(dto.isEmailOnComment());
        pref.setEmailOnReply(dto.isEmailOnReply());
        pref.setEmailOnLike(dto.isEmailOnLike());
        pref.setEmailOnWishlist(dto.isEmailOnWishlist());
        return toDto(preferenceRepository.save(pref));
    }

    public boolean wantsEmail(Long userId, String eventType) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> defaultPreference(userId));
        return switch (eventType) {
            case "COMMENT"  -> pref.isEmailOnComment();
            case "REPLY"    -> pref.isEmailOnReply();
            case "LIKE"     -> pref.isEmailOnLike();
            case "WISHLIST" -> pref.isEmailOnWishlist();
            default         -> false;
        };
    }

    private NotificationPreference defaultPreference(Long userId) {
        return NotificationPreference.builder().userId(userId).build();
    }

    private NotificationPreferenceDto toDto(NotificationPreference pref) {
        return NotificationPreferenceDto.builder()
                .emailOnComment(pref.isEmailOnComment())
                .emailOnReply(pref.isEmailOnReply())
                .emailOnLike(pref.isEmailOnLike())
                .emailOnWishlist(pref.isEmailOnWishlist())
                .build();
    }
}
