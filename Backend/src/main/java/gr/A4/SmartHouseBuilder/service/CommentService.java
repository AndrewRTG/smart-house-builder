package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.dto.CommentRequest;
import gr.A4.SmartHouseBuilder.dto.CommentResponse;
import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.Comment;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.User;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.CommentRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import gr.A4.SmartHouseBuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final SetupRepository setupRepository;
    private final ArticleRepository articleRepository;

    @Transactional
    public CommentResponse createSetupComment(Long setupId, String email, CommentRequest req) {
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new RuntimeException("Comment content cannot be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Setup setup = setupRepository.findById(setupId)
                .orElseThrow(() -> new RuntimeException("Setup not found"));

        Comment comment = Comment.builder()
                .user(user)
                .setup(setup)
                .content(req.getContent())
                .replies(new ArrayList<>())
                .build();

        if (req.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(req.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));

            if (!parent.getSetup().getId().equals(setupId)) {
                throw new RuntimeException("Parent comment does not belong to this setup");
            }

            comment.setParentComment(parent);
        }

        Comment saved = commentRepository.save(comment);
        log.info("Comment created on setup: {} by user: {}", setupId, email);

        return toResponseTree(saved, user.getId());
    }

    @Transactional
    public CommentResponse createArticleComment(Long articleId, String email, CommentRequest req) {
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new RuntimeException("Comment content cannot be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        Comment comment = Comment.builder()
                .user(user)
                .article(article)
                .content(req.getContent())
                .replies(new ArrayList<>())
                .build();

        if (req.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(req.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));

            if (!parent.getArticle().getId().equals(articleId)) {
                throw new RuntimeException("Parent comment does not belong to this article");
            }

            comment.setParentComment(parent);
        }

        Comment saved = commentRepository.save(comment);
        log.info("Comment created on article: {} by user: {}", articleId, email);

        return toResponseTree(saved, user.getId());
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        // If the comment is already a [deleted] stub, its user reference is
        // conceptually null — nobody should be "re-deleting" it. Also reject
        // if the caller isn't the author.
        if (comment.isDeleted()) {
            throw new RuntimeException("Comment already deleted");
        }
        if (comment.getUser() == null || !comment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Only comment author can delete");
        }

        // Applies to both setup AND article comments — the Comment entity is
        // shared, so one code path covers every commentable target.
        //
        // Branching rule (per design decision):
        //   - Comment HAS replies -> soft-delete as "[deleted]" stub so the
        //     thread structure under it stays intact. Content is wiped for
        //     privacy, user ref is cleared so we emit a generic "User".
        //   - Comment has NO replies -> hard-delete. A leaf "[deleted]"
        //     gravestone would just be noise. Also, after removing this
        //     leaf, if its parent is itself a [deleted] stub whose last
        //     child we just removed, we can clean the parent up too, and
        //     keep walking up the chain until we hit a real comment or run
        //     out of ancestors.
        //
        // We count children with a fresh DB query rather than reading
        // comment.getReplies() because we removed CascadeType.ALL from the
        // entity (see Comment.java) and the in-memory list is now lazy and
        // sometimes stale within a transaction. The repository's
        // countByParentCommentId is the source of truth.
        boolean hasReplies = commentRepository.countByParentCommentId(commentId) > 0;

        if (hasReplies) {
            comment.setContent(null);
            comment.setUser(null);
            comment.setDeleted(true);
            commentRepository.save(comment);
            log.info("Comment soft-deleted (had replies): {} by user: {}", commentId, email);
        } else {
            Comment parent = comment.getParentComment();
            commentRepository.delete(comment);
            cleanupDeletedAncestors(parent);
            log.info("Comment hard-deleted (no replies): {} by user: {}", commentId, email);
        }
    }

    /**
     * Walk up the thread from a just-deleted comment. If the parent is itself
     * a "[deleted]" stub AND its last remaining child was the one we just
     * removed, the stub has nothing left to preserve — we can hard-delete it
     * too, then repeat with its grandparent.
     *
     * The loop terminates when we hit a non-deleted comment, a deleted stub
     * that still has other children, or the root (parent == null).
     *
     * We count children via a fresh query instead of the in-memory collection
     * because after deleting a child, Hibernate's parent.replies list may
     * still contain the removed entity in this transaction's context.
     */
    private void cleanupDeletedAncestors(Comment ancestor) {
        while (ancestor != null && ancestor.isDeleted()) {
            long remainingChildren = commentRepository.countByParentCommentId(ancestor.getId());
            if (remainingChildren > 0) {
                break;
            }
            Comment grandparent = ancestor.getParentComment();
            commentRepository.delete(ancestor);
            ancestor = grandparent;
        }
    }

    /**
     * Hard-delete every comment attached to a setup, regardless of soft-deleted
     * state. Used by SetupService.deleteSetup as a replacement for the
     * implicit JPA cascade we removed from Comment.replies (see Comment.java
     * for the rationale).
     *
     * Algorithm: post-order DFS from each root. We delete leaves first, then
     * their parents, so the self-FK parent_comment_id never points at a
     * non-existent row mid-transaction. A bulk JPQL delete won't work for the
     * same reason — Postgres evaluates FKs row by row.
     */
    @Transactional
    public void deleteCommentTreeForSetup(Long setupId) {
        commentRepository.findBySetupIdAndParentCommentIsNull(setupId)
                .forEach(this::deleteSubtree);
    }

    /**
     * Twin of deleteCommentTreeForSetup but for an article.
     * ArticleService used to leave comments dangling on article delete (the
     * row's FK to articles is non-nullable, so an article delete would 500
     * once the article had even one comment); calling this from
     * ArticleService.deleteArticle fixes that.
     */
    @Transactional
    public void deleteCommentTreeForArticle(Long articleId) {
        commentRepository.findByArticleIdAndParentCommentIsNull(articleId)
                .forEach(this::deleteSubtree);
    }

    /**
     * Post-order recursive delete. Reads child rows from the DB (not the
     * possibly-stale in-memory replies collection, which we no longer
     * cascade-fetch).
     */
    private void deleteSubtree(Comment node) {
        // Snapshot children before we start deleting, otherwise iterating a
        // collection that's mutating under us is undefined behaviour.
        List<Comment> children = new ArrayList<>(
                commentRepository.findByParentCommentId(node.getId()));
        for (Comment child : children) {
            deleteSubtree(child);
        }
        commentRepository.delete(node);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getSetupComments(Long setupId, Pageable pageable, String email) {
        try {
            Long userId = email != null ? getUserIdOrNull(email) : null;
            final Long finalUserId = userId;

            return commentRepository.findBySetupIdAndParentCommentIsNull(setupId, pageable)
                    .map(comment -> toResponseTree(comment, finalUserId));
        } catch (Exception e) {
            // Surface the real cause in the backend log instead of a silent 500.
            log.error("getSetupComments failed for setupId={}, email={}: {}", setupId, email, e.toString(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getArticleComments(Long articleId, Pageable pageable, String email) {
        try {
            Long userId = email != null ? getUserIdOrNull(email) : null;
            final Long finalUserId = userId;

            return commentRepository.findByArticleIdAndParentCommentIsNull(articleId, pageable)
                    .map(comment -> toResponseTree(comment, finalUserId));
        } catch (Exception e) {
            log.error("getArticleComments failed for articleId={}, email={}: {}", articleId, email, e.toString(), e);
            throw e;
        }
    }

    public long getSetupCommentCount(Long setupId) {
        return commentRepository.countBySetupId(setupId);
    }

    public long getArticleCommentCount(Long articleId) {
        return commentRepository.countByArticleId(articleId);
    }

    private CommentResponse toResponseTree(Comment comment, Long currentUserId) {
        List<CommentResponse> replies = new ArrayList<>();
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            replies = comment.getReplies().stream()
                    .map(reply -> toResponseTree(reply, currentUserId))
                    .collect(Collectors.toList());
        }

        // Soft-deleted stub: emit generic "User" placeholder data so no frontend
        // logic has to know what "deleted" means at the rendering layer. The
        // avatar comes out as a grey "U" because username="User" -> first char
        // is "U", which the existing CommentsSection avatar code already does.
        if (comment.isDeleted()) {
            return CommentResponse.builder()
                    .id(comment.getId())
                    .userId(null)
                    .username("User")
                    .content("[deleted]")
                    .createdAt(comment.getCreatedAt())
                    .isOwner(false)
                    .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                    .replies(replies)
                    .deleted(true)
                    .build();
        }

        // Defensive null-safety: if a comment somehow has a null user without
        // being marked deleted (orphaned FK, bad seed data), we still surface
        // a placeholder instead of NPE-ing into a 500.
        User author = comment.getUser();
        Long authorId = author != null ? author.getId() : null;
        String authorName = author != null ? author.getUsername() : "User";

        return CommentResponse.builder()
                .id(comment.getId())
                .userId(authorId)
                .username(authorName)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .isOwner(currentUserId != null && authorId != null && currentUserId.equals(authorId))
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .replies(replies)
                .deleted(false)
                .build();
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();
    }

    /**
     * Like getUserId but returns null when the email doesn't map to a user (e.g. the
     * JWT filter authenticated a token whose user was since deleted). Lets the
     * "fetch comments" flow keep working for everyone else even when that happens.
     */
    private Long getUserIdOrNull(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }
}
