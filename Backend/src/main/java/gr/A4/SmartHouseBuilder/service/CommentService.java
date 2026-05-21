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
import gr.A4.SmartHouseBuilder.exception.InappropriateContentException;
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
    private final ActivityEmailService activityEmailService;
    private final BadWordFilterService badWordFilterService;

    @Transactional
    public CommentResponse createSetupComment(Long setupId, String email, CommentRequest req) {
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new RuntimeException("Comment content cannot be empty");
        }
        validateCommentContent(req.getContent());

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

        String excerpt = saved.getContent().length() > 120
                ? saved.getContent().substring(0, 120) + "…"
                : saved.getContent();

        // Notify setup owner (unless they commented on their own post).
        User setupOwner = setup.getUser();
        if (setupOwner != null && !setupOwner.getId().equals(user.getId())) {
            activityEmailService.onComment(setupOwner, user.getUsername(), setup.getName(), "SETUP", excerpt);
        }

        // Notify parent comment author on a reply (unless they are the same person).
        if (comment.getParentComment() != null) {
            User parentAuthor = comment.getParentComment().getUser();
            if (parentAuthor != null && !parentAuthor.getId().equals(user.getId())) {
                activityEmailService.onReply(parentAuthor, user.getUsername(), setup.getName(), "SETUP", excerpt);
            }
        }

        return toResponseTree(saved, user.getId());
    }

    @Transactional
    public CommentResponse createArticleComment(Long articleId, String email, CommentRequest req) {
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new RuntimeException("Comment content cannot be empty");
        }
        validateCommentContent(req.getContent());

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

        String excerpt = saved.getContent().length() > 120
                ? saved.getContent().substring(0, 120) + "…"
                : saved.getContent();

        User articleOwner = article.getUser();
        if (articleOwner != null && !articleOwner.getId().equals(user.getId())) {
            activityEmailService.onComment(articleOwner, user.getUsername(), article.getTitle(), "ARTICLE", excerpt);
        }

        if (comment.getParentComment() != null) {
            User parentAuthor = comment.getParentComment().getUser();
            if (parentAuthor != null && !parentAuthor.getId().equals(user.getId())) {
                activityEmailService.onReply(parentAuthor, user.getUsername(), article.getTitle(), "ARTICLE", excerpt);
            }
        }

        return toResponseTree(saved, user.getId());
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        if (comment.isDeleted()) {
            throw new RuntimeException("Comment already deleted");
        }
        if (comment.getUser() == null || !comment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Only comment author can delete");
        }

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

    @Transactional
    public void deleteCommentTreeForSetup(Long setupId) {
        commentRepository.findBySetupIdAndParentCommentIsNull(setupId)
                .forEach(this::deleteSubtree);
    }

    @Transactional
    public void deleteCommentTreeForArticle(Long articleId) {
        commentRepository.findByArticleIdAndParentCommentIsNull(articleId)
                .forEach(this::deleteSubtree);
    }

    private void deleteSubtree(Comment node) {
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
            return commentRepository.findBySetupIdAndParentCommentIsNull(setupId, pageable)
                    .map(comment -> toResponseTree(comment, userId));
        } catch (Exception e) {
            log.error("getSetupComments failed for setupId={}, email={}: {}", setupId, email, e.toString(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getArticleComments(Long articleId, Pageable pageable, String email) {
        try {
            Long userId = email != null ? getUserIdOrNull(email) : null;
            return commentRepository.findByArticleIdAndParentCommentIsNull(articleId, pageable)
                    .map(comment -> toResponseTree(comment, userId));
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

        if (comment.isDeleted()) {
            return CommentResponse.builder()
                    .id(comment.getId())
                    .userId(null)
                    .username("User")
                    .avatarUrl(null)
                    .content("[deleted]")
                    .createdAt(comment.getCreatedAt())
                    .isOwner(false)
                    .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                    .replies(replies)
                    .deleted(true)
                    .build();
        }

        User author = comment.getUser();
        Long authorId = author != null ? author.getId() : null;
        String authorName = author != null ? author.getUsername() : "User";
        String authorAvatar = author != null ? author.getAvatarUrl() : null;

        return CommentResponse.builder()
                .id(comment.getId())
                .userId(authorId)
                .username(authorName)
                .avatarUrl(authorAvatar)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .isOwner(currentUserId != null && authorId != null && currentUserId.equals(authorId))
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .replies(replies)
                .deleted(false)
                .build();
    }
    private void validateCommentContent(String content) {
        if (badWordFilterService.containsBadWords(content)) {
            throw new InappropriateContentException("Comentariul contine limbaj nepotrivit.");
        }
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email))
                .getId();
    }

    private Long getUserIdOrNull(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }
}