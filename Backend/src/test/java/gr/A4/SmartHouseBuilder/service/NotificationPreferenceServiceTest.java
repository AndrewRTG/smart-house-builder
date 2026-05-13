package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.NotificationPreferenceDto;
import gr.A4.SmartHouseBuilder.entity.NotificationPreference;
import gr.A4.SmartHouseBuilder.repository.NotificationPreferenceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {

    @Mock private NotificationPreferenceRepository preferenceRepository;
    @InjectMocks private NotificationPreferenceService preferenceService;

    @Test
    void getPreference_returnsDefaultsWhenNoRowExists() {
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        NotificationPreferenceDto result = preferenceService.getPreference(1L);

        assertThat(result.isEmailOnComment()).isTrue();
        assertThat(result.isEmailOnReply()).isTrue();
        assertThat(result.isEmailOnLike()).isFalse();
        assertThat(result.isEmailOnWishlist()).isFalse();
    }

    @Test
    void getPreference_returnsStoredValues() {
        NotificationPreference stored = NotificationPreference.builder()
                .userId(2L).emailOnComment(false).emailOnReply(false)
                .emailOnLike(true).emailOnWishlist(true).build();
        when(preferenceRepository.findByUserId(2L)).thenReturn(Optional.of(stored));

        NotificationPreferenceDto result = preferenceService.getPreference(2L);

        assertThat(result.isEmailOnComment()).isFalse();
        assertThat(result.isEmailOnLike()).isTrue();
        assertThat(result.isEmailOnWishlist()).isTrue();
    }

    @Test
    void updatePreference_persistsAllFields() {
        NotificationPreference existing = NotificationPreference.builder()
                .userId(3L).emailOnComment(true).emailOnReply(true).build();
        when(preferenceRepository.findByUserId(3L)).thenReturn(Optional.of(existing));
        when(preferenceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NotificationPreferenceDto dto = NotificationPreferenceDto.builder()
                .emailOnComment(false).emailOnReply(false)
                .emailOnLike(true).emailOnWishlist(true).build();
        NotificationPreferenceDto result = preferenceService.updatePreference(3L, dto);

        assertThat(result.isEmailOnComment()).isFalse();
        assertThat(result.isEmailOnReply()).isFalse();
        assertThat(result.isEmailOnLike()).isTrue();
        assertThat(result.isEmailOnWishlist()).isTrue();

        ArgumentCaptor<NotificationPreference> captor = ArgumentCaptor.forClass(NotificationPreference.class);
        verify(preferenceRepository).save(captor.capture());
        assertThat(captor.getValue().isEmailOnLike()).isTrue();
    }

    @Test
    void updatePreference_createsRowWhenNoneExists() {
        when(preferenceRepository.findByUserId(4L)).thenReturn(Optional.empty());
        when(preferenceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NotificationPreferenceDto dto = NotificationPreferenceDto.builder()
                .emailOnComment(true).emailOnReply(true)
                .emailOnLike(true).emailOnWishlist(false).build();

        NotificationPreferenceDto result = preferenceService.updatePreference(4L, dto);

        assertThat(result.isEmailOnLike()).isTrue();
        verify(preferenceRepository).save(any(NotificationPreference.class));
    }

    @Test
    void wantsEmail_returnsTrueForCommentByDefault() {
        when(preferenceRepository.findByUserId(5L)).thenReturn(Optional.empty());
        assertThat(preferenceService.wantsEmail(5L, "COMMENT")).isTrue();
    }

    @Test
    void wantsEmail_returnsFalseForLikeByDefault() {
        when(preferenceRepository.findByUserId(5L)).thenReturn(Optional.empty());
        assertThat(preferenceService.wantsEmail(5L, "LIKE")).isFalse();
    }

    @Test
    void wantsEmail_returnsStoredValueForLike() {
        NotificationPreference pref = NotificationPreference.builder()
                .userId(6L).emailOnLike(true).build();
        when(preferenceRepository.findByUserId(6L)).thenReturn(Optional.of(pref));
        assertThat(preferenceService.wantsEmail(6L, "LIKE")).isTrue();
    }

    @Test
    void wantsEmail_returnsFalseForUnknownEventType() {
        when(preferenceRepository.findByUserId(7L)).thenReturn(Optional.empty());
        assertThat(preferenceService.wantsEmail(7L, "UNKNOWN")).isFalse();
    }
}
