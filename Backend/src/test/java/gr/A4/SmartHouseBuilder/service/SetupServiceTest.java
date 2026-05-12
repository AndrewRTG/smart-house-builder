package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.SetupRequest;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.exception.DuplicateSetupNameException;
import gr.A4.SmartHouseBuilder.exception.UnchangedCopyPublishException;
import gr.A4.SmartHouseBuilder.repository.CommentRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.repository.WishlistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SetupServiceTest {

    @Mock private SetupRepository setupRepository;
    @Mock private UserRepository userRepository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @Mock private CommentService commentService;
    @Mock private CommentRepository commentRepository;
    @Mock private LikeRepository likeRepository;
    @Mock private WishlistRepository wishlistRepository;

    @InjectMocks private SetupService setupService;

    private SetupRequest request(String name, String description, List<Long> deviceIds, boolean isPublic) {
        SetupRequest req = new SetupRequest();
        req.setName(name);
        req.setDescription(description);
        req.setDeviceIds(deviceIds);
        req.setPublic(isPublic);
        return req;
    }

    @Test
    void createSetup_persistsAndReturnsDraft() {
        User user = User.builder().id(1L).email("u@e").username("u").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.existsByUserIdAndNameIgnoreCase(1L, "My Setup")).thenReturn(false);
        when(setupRepository.save(any(Setup.class))).thenAnswer(inv -> {
            Setup s = inv.getArgument(0);
            s.setId(42L);
            return s;
        });

        Setup saved = setupService.createSetup("u@e", request("My Setup", "Desc", List.of(1L, 2L), true));

        assertThat(saved.getId()).isEqualTo(42L);
        assertThat(saved.getName()).isEqualTo("My Setup");
        assertThat(saved.isPublicSetup()).isTrue();
        assertThat(saved.getDeviceIds()).isEqualTo("[1,2]");
    }

    @Test
    void createSetup_throwsOnDuplicateNamePerUser() {
        User user = User.builder().id(1L).email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.existsByUserIdAndNameIgnoreCase(1L, "Dup")).thenReturn(true);

        assertThatThrownBy(() -> setupService.createSetup("u@e", request("Dup", "", List.of(), false)))
                .isInstanceOf(DuplicateSetupNameException.class);
        verify(setupRepository, never()).save(any());
    }

    @Test
    void getSetup_returnsWhenPresent() {
        Setup setup = Setup.builder().id(10L).name("S").build();
        when(setupRepository.findById(10L)).thenReturn(Optional.of(setup));
        assertThat(setupService.getSetup(10L)).isEqualTo(setup);
    }

    @Test
    void getSetup_throwsWhenMissing() {
        when(setupRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> setupService.getSetup(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Setup not found");
    }

    @Test
    void updateSetup_savesNewValues() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup existing = Setup.builder().id(10L).user(user).name("Old").description("Old").deviceIds("[]").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(setupRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(1L, "New", 10L)).thenReturn(false);
        when(setupRepository.save(any(Setup.class))).thenAnswer(inv -> inv.getArgument(0));

        Setup updated = setupService.updateSetup(10L, "u@e", request("New", "New desc", List.of(7L), true));

        assertThat(updated.getName()).isEqualTo("New");
        assertThat(updated.getDescription()).isEqualTo("New desc");
        assertThat(updated.isPublicSetup()).isTrue();
    }

    @Test
    void updateSetup_throwsOnRenameCollision() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup existing = Setup.builder().id(10L).user(user).name("Old").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(setupRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(1L, "Collide", 10L)).thenReturn(true);

        assertThatThrownBy(() -> setupService.updateSetup(10L, "u@e", request("Collide", "", List.of(), false)))
                .isInstanceOf(DuplicateSetupNameException.class);
    }

    @Test
    void deleteSetup_cascadesCommentsLikesWishlistAndRemoves() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup setup = Setup.builder().id(10L).user(user).status(SetupStatus.PUBLISHED).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(setup));

        setupService.deleteSetup(10L, "u@e");

        verify(commentService).deleteCommentTreeForSetup(10L);
        verify(likeRepository).deleteAllBySetupId(10L);
        verify(wishlistRepository).deleteAllBySetupId(10L);
        verify(setupRepository).delete(setup);
    }

    @Test
    void deleteSetup_throwsWhenNotOwned() {
        User user = User.builder().id(1L).email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> setupService.deleteSetup(10L, "u@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not owned");
        verify(setupRepository, never()).delete(any());
    }

    @Test
    void copySetup_createsDraftDuplicateWithCustomName() {
        User user = User.builder().id(2L).email("u@e").build();
        Setup original = Setup.builder().id(10L).publicSetup(true).description("Desc").deviceIds("[1,2]").name("Orig").build();
        when(setupRepository.findById(10L)).thenReturn(Optional.of(original));
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.existsByUserIdAndNameIgnoreCase(2L, "Mine")).thenReturn(false);
        when(setupRepository.save(any(Setup.class))).thenAnswer(inv -> {
            Setup s = inv.getArgument(0);
            s.setId(50L);
            return s;
        });

        Setup copy = setupService.copySetup(10L, "u@e", "Mine");

        assertThat(copy.getName()).isEqualTo("Mine");
        assertThat(copy.getStatus()).isEqualTo(SetupStatus.DRAFT);
        assertThat(copy.isPublicSetup()).isFalse();
        assertThat(copy.getCopiedFromId()).isEqualTo(10L);
        assertThat(copy.getOriginalDeviceIds()).isEqualTo("[1,2]");
        assertThat(copy.getOriginalDescription()).isEqualTo("Desc");
    }

    @Test
    void copySetup_throwsOnCustomNameCollision() {
        User user = User.builder().id(2L).email("u@e").build();
        Setup original = Setup.builder().id(10L).publicSetup(true).deviceIds("[]").name("Orig").build();
        when(setupRepository.findById(10L)).thenReturn(Optional.of(original));
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.existsByUserIdAndNameIgnoreCase(2L, "Mine")).thenReturn(true);

        assertThatThrownBy(() -> setupService.copySetup(10L, "u@e", "Mine"))
                .isInstanceOf(DuplicateSetupNameException.class);
    }

    @Test
    void copySetup_throwsWhenOriginalNotPublic() {
        Setup original = Setup.builder().id(10L).publicSetup(false).build();
        when(setupRepository.findById(10L)).thenReturn(Optional.of(original));

        assertThatThrownBy(() -> setupService.copySetup(10L, "u@e", "Mine"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not public");
    }

    @Test
    void copySetup_autoNamesWhenNoCustomNameProvided() {
        User user = User.builder().id(2L).email("u@e").build();
        Setup original = Setup.builder().id(10L).publicSetup(true).name("Orig").deviceIds("[]").build();
        when(setupRepository.findById(10L)).thenReturn(Optional.of(original));
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.existsByUserIdAndNameIgnoreCase(2L, "Copy of Orig")).thenReturn(false);
        when(setupRepository.save(any(Setup.class))).thenAnswer(inv -> inv.getArgument(0));

        Setup copy = setupService.copySetup(10L, "u@e", null);

        assertThat(copy.getName()).isEqualTo("Copy of Orig");
    }

    @Test
    void publishSetup_marksPublishedAndPublic() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup setup = Setup.builder().id(10L).user(user).deviceIds("[1,2]").status(SetupStatus.DRAFT).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(setup));
        when(setupRepository.save(any(Setup.class))).thenAnswer(inv -> inv.getArgument(0));

        Setup published = setupService.publishSetup(10L, "u@e");

        assertThat(published.getStatus()).isEqualTo(SetupStatus.PUBLISHED);
        assertThat(published.isPublicSetup()).isTrue();
    }

    @Test
    void publishSetup_throwsWhenNoDevices() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup setup = Setup.builder().id(10L).user(user).deviceIds("[]").status(SetupStatus.DRAFT).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(setup));

        assertThatThrownBy(() -> setupService.publishSetup(10L, "u@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("at least one device");
    }

    @Test
    void publishSetup_throwsWhenCopyIsUnchangedFromOriginal() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup copy = Setup.builder()
                .id(20L).user(user)
                .deviceIds("[1,2]")
                .description("Same desc")
                .copiedFromId(10L)
                .originalDeviceIds("[2,1]")
                .originalDescription("Same desc")
                .status(SetupStatus.DRAFT)
                .build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(copy));

        assertThatThrownBy(() -> setupService.publishSetup(20L, "u@e"))
                .isInstanceOf(UnchangedCopyPublishException.class);
    }

    @Test
    void publishSetup_allowsCopyWhenDevicesChanged() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup copy = Setup.builder()
                .id(20L).user(user)
                .deviceIds("[1,2,3]")
                .description("Same desc")
                .copiedFromId(10L)
                .originalDeviceIds("[1,2]")
                .originalDescription("Same desc")
                .status(SetupStatus.DRAFT)
                .build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(copy));
        when(setupRepository.save(any(Setup.class))).thenAnswer(inv -> inv.getArgument(0));

        Setup published = setupService.publishSetup(20L, "u@e");
        assertThat(published.getStatus()).isEqualTo(SetupStatus.PUBLISHED);
    }

    @Test
    void getUserDrafts_returnsDraftsOnly() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup draft = Setup.builder().id(10L).status(SetupStatus.DRAFT).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByUserIdAndStatus(1L, SetupStatus.DRAFT)).thenReturn(List.of(draft));

        assertThat(setupService.getUserDrafts("u@e")).containsExactly(draft);
    }

    @Test
    void getUserPublished_returnsPublishedOnly() {
        User user = User.builder().id(1L).email("u@e").build();
        Setup pub = Setup.builder().id(10L).status(SetupStatus.PUBLISHED).build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findByUserIdAndStatus(1L, SetupStatus.PUBLISHED)).thenReturn(List.of(pub));

        assertThat(setupService.getUserPublished("u@e")).containsExactly(pub);
    }

    @Test
    void getPublicSetups_returnsPublishedPagedAndDefaultsSortByUpdatedAt() {
        Pageable unsorted = PageRequest.of(0, 5);
        Setup s = Setup.builder().id(10L).status(SetupStatus.PUBLISHED).build();
        Page<Setup> page = new PageImpl<>(List.of(s), unsorted, 1);
        when(setupRepository.findByPublicSetupTrueAndStatus(any(Pageable.class), eq(SetupStatus.PUBLISHED)))
                .thenReturn(page);

        Page<Setup> result = setupService.getPublicSetups(unsorted);

        assertThat(result.getTotalElements()).isEqualTo(1);
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(setupRepository).findByPublicSetupTrueAndStatus(captor.capture(), eq(SetupStatus.PUBLISHED));
        assertThat(captor.getValue().getSort().getOrderFor("updatedAt")).isNotNull();
    }
}
