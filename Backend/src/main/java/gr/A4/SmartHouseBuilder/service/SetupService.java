package gr.A4.SmartHouseBuilder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import gr.A4.SmartHouseBuilder.dto.PublishSetupRequest;
import gr.A4.SmartHouseBuilder.dto.SetupRequest;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.exception.DuplicateSetupNameException;
import gr.A4.SmartHouseBuilder.exception.ResourceNotFoundException;
import gr.A4.SmartHouseBuilder.exception.UnchangedCopyPublishException;
import gr.A4.SmartHouseBuilder.repository.CommentRepository;
import gr.A4.SmartHouseBuilder.repository.LikeRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import gr.A4.SmartHouseBuilder.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SetupService {
    private final SetupRepository setupRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    // These three repos + CommentService are only needed for the
    // cascade-delete path in deleteSetup. We go through CommentService for
    // the comment subtree because Comment.java no longer has CascadeType.ALL
    // — see the doc comment on Comment.replies for why.
    private final CommentService commentService;
    // The setup entity has no inverse collections for these (they live on
    // @ManyToOne sides), so we clear them explicitly before removing the setup.
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final WishlistRepository wishlistRepository;

    @Transactional
    public Setup createSetup(String email, SetupRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        // Enforce per-user unique name. Case-insensitive so "Living Room" and
        // "living room" still collide — we don't want near-duplicates either.
        String requestedName = request.getName() != null ? request.getName().trim() : "";
        if (setupRepository.existsByUserIdAndNameIgnoreCase(user.getId(), requestedName)) {
            throw new DuplicateSetupNameException(
                    "You already have a setup named \"" + requestedName + "\". Pick a different name.");
        }

        Setup setup = Setup.builder()
                .user(user)
                .name(requestedName)
                .description(request.getDescription())
                .deviceIds(serializeDeviceIds(request.getDeviceIds()))
                .publicSetup(request.isPublic())
                .tags(serializeTags(request.getTags()))
                .thumbnailUrl(request.getThumbnailUrl())
                .canvasState(request.getCanvasState())
                .deviceSnapshots(request.getDeviceSnapshots())
                .build();

        Setup saved = setupRepository.save(setup);
        log.info("Setup created: {} by user: {}", saved.getId(), email);
        return saved;
    }

    public Setup getSetup(Long id) {
        return setupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Setup not found"));
    }

    @Transactional
    public Setup updateSetup(Long id, String email, SetupRequest request) {
        Long userId = getUserId(email);
        Setup setup = setupRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Setup not found or not owned by you"));

        String requestedName = request.getName() != null ? request.getName().trim() : "";
        // Rename guard: allow keeping the current name, but reject a rename that
        // collides with another of this user's setups. The ...AndIdNot variant
        // excludes the row we're editing so "change nothing and save" still works.
        if (setupRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, requestedName, id)) {
            throw new DuplicateSetupNameException(
                    "You already have a setup named \"" + requestedName + "\". Pick a different name.");
        }

        setup.setName(requestedName);
        setup.setDescription(request.getDescription());
        setup.setDeviceIds(serializeDeviceIds(request.getDeviceIds()));
        setup.setPublicSetup(request.isPublic());
        setup.setTags(serializeTags(request.getTags()));
        if (request.getThumbnailUrl() != null) setup.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getCanvasState() != null) setup.setCanvasState(request.getCanvasState());
        if (request.getDeviceSnapshots() != null) setup.setDeviceSnapshots(request.getDeviceSnapshots());

        Setup updated = setupRepository.save(setup);
        log.info("Setup updated: {} by user: {}", id, email);
        return updated;
    }

    @Transactional
    public void deleteSetup(Long id, String email) {
        Long userId = getUserId(email);
        Setup setup = setupRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Setup not found or not owned by you"));

        // Owners can delete their own setups regardless of status (DRAFT or
        // PUBLISHED). There's no reason to lock a user out of removing their
        // own content from the feed — it's their data.
        //
        // Before deleting the setup row, we must clear every table that has a
        // non-nullable FK to it, otherwise Postgres rejects the parent delete:
        //   - comments.setup_id  (on-delete: no action)
        //   - likes.setup_id     (on-delete: no action)
        //   - wishlist.setup_id  (on-delete: no action)
        //
        // For comments: Comment has a self-referencing parent_comment_id FK
        // (for threaded replies). After the 2026-04-27 entity refactor,
        // Comment.replies no longer has CascadeType.ALL, so we can't just
        // delete the root and let JPA recurse. CommentService.deleteCommentTreeForSetup
        // walks each root post-order (leaves first, then the parent, then
        // the grandparent...) so the self-FK never points at a missing row
        // mid-transaction. The previous comment in this file claimed the
        // cascade was the only safe path; that's no longer true and the
        // explicit walk is the new contract.
        //
        // Likes and wishlist don't have self-refs, so a single bulk DELETE is
        // fine for them and saves a round trip per row.
        commentService.deleteCommentTreeForSetup(id);
        likeRepository.deleteAllBySetupId(id);
        wishlistRepository.deleteAllBySetupId(id);

        // Note the 'copied_from_id' column on other setups (if anyone copied
        // this one) is deliberately NOT a real FK — see Setup.java. Those
        // copies keep their snapshot and the soft-FK just becomes a dangling
        // historical pointer, which is exactly the behavior we want.
        setupRepository.delete(setup);
        log.info("Setup deleted: {} (status={}) by user: {}", id, setup.getStatus(), email);
    }

    @Transactional
    public Setup copySetup(Long id, String email, String customName) {
        Setup original = setupRepository.findById(id)
                .filter(Setup::isPublicSetup)
                .orElseThrow(() -> new RuntimeException("Setup not found or not public"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        // Decide on a name. If the user typed one, honor it exactly and reject
        // on collision (same rule as createSetup). If they didn't, auto-pick
        // "Copy of X", "Copy of X (2)", ... until we find one that's free.
        String name;
        if (customName != null && !customName.isBlank()) {
            name = customName.trim();
            if (setupRepository.existsByUserIdAndNameIgnoreCase(user.getId(), name)) {
                throw new DuplicateSetupNameException(
                        "You already have a setup named \"" + name + "\". Pick a different name.");
            }
        } else {
            name = generateUniqueCopyName(user.getId(), "Copy of " + original.getName());
        }

        // The copy inherits everything the original had so it's functionally
        // identical on arrival in My Setups: name (modified), description,
        // device list. We also freeze a SNAPSHOT of description + deviceIds
        // at this moment — publishSetup later compares against this snapshot
        // to reject unchanged republishes.
        Setup copy = Setup.builder()
                .user(user)
                .name(name)
                .description(original.getDescription())
                .deviceIds(original.getDeviceIds())
                .publicSetup(false)
                .status(SetupStatus.DRAFT)
                .copiedFromId(original.getId())
                .originalDeviceIds(original.getDeviceIds())
                .originalDescription(original.getDescription())
                .build();

        Setup saved = setupRepository.save(copy);
        log.info("Setup copied: {} -> {} by user: {} (with lineage snapshot)",
                original.getId(), saved.getId(), email);
        return saved;
    }

    /**
     * Finds a free name by appending " (2)", " (3)", etc. until no collision.
     * Called when the caller didn't specify a custom name on copy.
     */
    private String generateUniqueCopyName(Long userId, String baseName) {
        if (!setupRepository.existsByUserIdAndNameIgnoreCase(userId, baseName)) {
            return baseName;
        }
        for (int i = 2; i < 1000; i++) {
            String candidate = baseName + " (" + i + ")";
            if (!setupRepository.existsByUserIdAndNameIgnoreCase(userId, candidate)) {
                return candidate;
            }
        }
        // Pathological fallback — user has 1000 copies with the same base name.
        return baseName + " (" + System.currentTimeMillis() + ")";
    }

    public List<Setup> getUserSetups(String email) {
        Long userId = getUserId(email);
        return setupRepository.findByUserIdAndPublicSetupFalse(userId);
    }

    @Transactional(readOnly = true)
    public List<Setup> getUserDrafts(String email) {
        Long userId = getUserId(email);
        return setupRepository.findByUserIdAndStatus(userId, SetupStatus.DRAFT);
    }

    @Transactional(readOnly = true)
    public List<Setup> getUserPublished(String email) {
        Long userId = getUserId(email);
        return setupRepository.findByUserIdAndStatus(userId, SetupStatus.PUBLISHED);
    }

    @Transactional(readOnly = true)
    public Page<Setup> getUserDrafts(String email, Pageable pageable) {
        Long userId = getUserId(email);
        return setupRepository.findByUserIdAndStatus(userId, SetupStatus.DRAFT, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Setup> getUserPublished(String email, Pageable pageable) {
        Long userId = getUserId(email);
        return setupRepository.findByUserIdAndStatus(userId, SetupStatus.PUBLISHED, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Setup> getPublicSetups(Pageable pageable) {
        // Default-sort the community feed by updatedAt DESC so a freshly-published
        // setup lands at the top of page 0 instead of being buried in whatever
        // order Postgres happens to return rows in.
        //
        // We deliberately use updatedAt (not createdAt) because publish() calls
        // save(), which bumps the @UpdateTimestamp. That matches the user's
        // mental model: "I published it just now, it should be first on the feed".
        //
        // If the incoming Pageable already has a sort, we honor it; only when
        // no sort was specified do we inject this default.
        Pageable sortedPageable = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(
                        pageable.getPageNumber(),
                        pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "updatedAt"));
        return setupRepository.findByPublicSetupTrueAndStatus(sortedPageable, SetupStatus.PUBLISHED);
    }

    @Transactional
    public Setup publishSetup(Long id, String email, PublishSetupRequest req) {
        Long userId = getUserId(email);
        Setup setup = setupRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Setup not found or not owned by you"));

        List<Long> deviceIds = deserializeDeviceIds(setup.getDeviceIds());
        if (deviceIds == null || deviceIds.isEmpty()) {
            throw new RuntimeException("Setup must have at least one device to publish");
        }

        // --- Copy-lineage guard ---
        // If this setup was copied from another one, compare its CURRENT state
        // to the snapshot we took at copy time. If the device set and the
        // description are both unchanged, the user hasn't actually contributed
        // anything and we reject the publish. The set-based comparison means
        // "remove device X then add device X back" doesn't fool the check —
        // the final set still equals the snapshot.
        if (req != null) {
            if (req.getDescription() != null) setup.setDescription(req.getDescription());
            if (req.getTags() != null) setup.setTags(serializeTags(req.getTags()));
        }

        if (setup.getCopiedFromId() != null && isUnchangedFromOriginal(setup)) {
            throw new UnchangedCopyPublishException(
                    "You cannot publish a copy without changing it. "
                            + "Modify the devices or description first, then publish.");
        }

        setup.setStatus(SetupStatus.PUBLISHED);
        setup.setPublicSetup(true);
        if (setup.getPublishedAt() == null) {
            setup.setPublishedAt(java.time.LocalDateTime.now());
        }
        Setup updated = setupRepository.save(setup);
        log.info("Setup published: {} by user: {}", id, email);
        return updated;
    }

    /**
     * Returns true when the copy's current devices + description still match
     * the snapshot taken at copy time. Name is deliberately excluded from the
     * comparison — renaming alone is not a real modification.
     *
     * Device list comparison is SET-BASED, not order- or sequence-based, so
     * the user can't bypass the check by removing and re-adding the same item.
     */
    private boolean isUnchangedFromOriginal(Setup setup) {
        Set<Long> currentDevices = new HashSet<>(deserializeDeviceIds(setup.getDeviceIds()));
        Set<Long> snapshotDevices = new HashSet<>(deserializeDeviceIds(setup.getOriginalDeviceIds()));
        boolean devicesUnchanged = currentDevices.equals(snapshotDevices);

        String currentDescription = setup.getDescription();
        String snapshotDescription = setup.getOriginalDescription();
        boolean descriptionUnchanged = Objects.equals(
                normalizeForCompare(currentDescription),
                normalizeForCompare(snapshotDescription));

        return devicesUnchanged && descriptionUnchanged;
    }

    /** Null-safe, whitespace-tolerant description comparison. */
    private String normalizeForCompare(String s) {
        if (s == null) return "";
        return s.trim();
    }

    public List<String> deserializeTags(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String serializeTags(List<String> tags) {
        if (tags == null) return null;
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize tags", e);
        }
    }

    private String serializeDeviceIds(List<Long> deviceIds) {
        try {
            return objectMapper.writeValueAsString(deviceIds);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize device IDs", e);
        }
    }

    private List<Long> deserializeDeviceIds(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();
    }
}
