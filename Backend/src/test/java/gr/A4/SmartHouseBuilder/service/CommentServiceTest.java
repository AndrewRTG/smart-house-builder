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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private UserRepository userRepository;
    @Mock private SetupRepository setupRepository;
    @Mock private ArticleRepository articleRepository;

    @InjectMocks private CommentService commentService;

    private User user(Long id, String email) {
        return User.builder().id(id).email(email).username("user" + id).build();
    }

    @Test
    void createSetupComment_savesAndReturnsResponse() {
        User user = user(1L, "u@e");
        Setup setup = Setup.builder().id(10L).user(user).name("S").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findById(10L)).thenReturn(Optional.of(setup));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });

        CommentRequest req = new CommentRequest("Hello world", null);
        CommentResponse response = commentService.createSetupComment(10L, "u@e", req);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getContent()).isEqualTo("Hello world");
        assertThat(response.getUsername()).isEqualTo("user1");
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void createSetupComment_throwsOnEmptyContent() {
        CommentRequest req = new CommentRequest("   ", null);

        assertThatThrownBy(() -> commentService.createSetupComment(10L, "u@e", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Comment content cannot be empty");
        verify(commentRepository, never()).save(any());
    }

    @Test
    void createSetupComment_throwsWhenUserMissing() {
        when(userRepository.findByEmail("missing@e")).thenReturn(Optional.empty());
        CommentRequest req = new CommentRequest("hi", null);

        assertThatThrownBy(() -> commentService.createSetupComment(10L, "missing@e", req))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void createSetupComment_throwsWhenSetupMissing() {
        User u = user(1L, "u@e");
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(setupRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createSetupComment(99L, "u@e", new CommentRequest("hi", null)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Setup not found");
    }

    @Test
    void createSetupComment_attachesParentReply() {
        User u = user(1L, "u@e");
        Setup setup = Setup.builder().id(10L).user(u).build();
        Comment parent = Comment.builder().id(50L).setup(setup).user(u).content("parent").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(setupRepository.findById(10L)).thenReturn(Optional.of(setup));
        when(commentRepository.findById(50L)).thenReturn(Optional.of(parent));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        CommentRequest req = new CommentRequest("reply", 50L);
        commentService.createSetupComment(10L, "u@e", req);

        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(captor.capture());
        assertThat(captor.getValue().getParentComment()).isEqualTo(parent);
    }

    @Test
    void createSetupComment_rejectsParentFromAnotherSetup() {
        User u = user(1L, "u@e");
        Setup setupA = Setup.builder().id(10L).user(u).build();
        Setup setupB = Setup.builder().id(20L).user(u).build();
        Comment otherParent = Comment.builder().id(50L).setup(setupB).user(u).build();

        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(setupRepository.findById(10L)).thenReturn(Optional.of(setupA));
        when(commentRepository.findById(50L)).thenReturn(Optional.of(otherParent));

        CommentRequest req = new CommentRequest("hi", 50L);
        assertThatThrownBy(() -> commentService.createSetupComment(10L, "u@e", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Parent comment does not belong");
    }

    @Test
    void createArticleComment_savesAndReturnsResponse() {
        User u = user(1L, "u@e");
        Article article = Article.builder().id(11L).user(u).title("A").content("body").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(articleRepository.findById(11L)).thenReturn(Optional.of(article));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(200L);
            return c;
        });

        CommentResponse response = commentService.createArticleComment(11L, "u@e", new CommentRequest("nice", null));
        assertThat(response.getId()).isEqualTo(200L);
        assertThat(response.getContent()).isEqualTo("nice");
    }

    @Test
    void createArticleComment_throwsWhenArticleMissing() {
        User u = user(1L, "u@e");
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(articleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createArticleComment(99L, "u@e", new CommentRequest("hi", null)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Article not found");
    }

    @Test
    void deleteComment_hardDeletesLeafCommentOwnedByUser() {
        User u = user(1L, "u@e");
        Comment leaf = Comment.builder().id(5L).user(u).content("x").replies(new ArrayList<>()).build();
        when(commentRepository.findById(5L)).thenReturn(Optional.of(leaf));
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(commentRepository.countByParentCommentId(5L)).thenReturn(0L);

        commentService.deleteComment(5L, "u@e");

        verify(commentRepository).delete(leaf);
    }

    @Test
    void deleteComment_softDeletesWhenHasReplies() {
        User u = user(1L, "u@e");
        Comment node = Comment.builder().id(5L).user(u).content("x").build();
        when(commentRepository.findById(5L)).thenReturn(Optional.of(node));
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));
        when(commentRepository.countByParentCommentId(5L)).thenReturn(2L);

        commentService.deleteComment(5L, "u@e");

        assertThat(node.isDeleted()).isTrue();
        assertThat(node.getUser()).isNull();
        assertThat(node.getContent()).isNull();
        verify(commentRepository).save(node);
        verify(commentRepository, never()).delete(any());
    }

    @Test
    void deleteComment_throwsWhenCallerIsNotAuthor() {
        User author = user(1L, "author@e");
        User other = user(2L, "other@e");
        Comment c = Comment.builder().id(5L).user(author).content("x").build();
        when(commentRepository.findById(5L)).thenReturn(Optional.of(c));
        when(userRepository.findByEmail("other@e")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> commentService.deleteComment(5L, "other@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Only comment author");
    }

    @Test
    void deleteComment_throwsWhenAlreadyDeleted() {
        User u = user(1L, "u@e");
        Comment c = Comment.builder().id(5L).user(u).content("x").deleted(true).build();
        when(commentRepository.findById(5L)).thenReturn(Optional.of(c));
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> commentService.deleteComment(5L, "u@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already deleted");
    }

    @Test
    void deleteComment_throwsWhenCommentMissing() {
        when(commentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> commentService.deleteComment(99L, "u@e"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Comment not found");
    }

    @Test
    void getSetupCommentCount_delegatesToRepository() {
        when(commentRepository.countBySetupId(10L)).thenReturn(7L);
        assertThat(commentService.getSetupCommentCount(10L)).isEqualTo(7L);
    }

    @Test
    void getArticleCommentCount_delegatesToRepository() {
        when(commentRepository.countByArticleId(11L)).thenReturn(3L);
        assertThat(commentService.getArticleCommentCount(11L)).isEqualTo(3L);
    }

    @Test
    void getSetupComments_returnsPageWithOwnerFlag() {
        User author = user(1L, "u@e");
        Comment root = Comment.builder().id(50L).user(author).content("hi").replies(new ArrayList<>()).build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Comment> page = new PageImpl<>(List.of(root), pageable, 1);

        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(author));
        when(commentRepository.findBySetupIdAndParentCommentIsNull(10L, pageable)).thenReturn(page);

        Page<CommentResponse> result = commentService.getSetupComments(10L, pageable, "u@e");

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).isOwner()).isTrue();
        assertThat(result.getContent().get(0).getContent()).isEqualTo("hi");
    }

    @Test
    void getArticleComments_returnsPageEvenWhenAnonymousReader() {
        User author = user(1L, "author@e");
        Comment root = Comment.builder().id(50L).user(author).content("body").replies(new ArrayList<>()).build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Comment> page = new PageImpl<>(List.of(root), pageable, 1);

        when(commentRepository.findByArticleIdAndParentCommentIsNull(11L, pageable)).thenReturn(page);

        Page<CommentResponse> result = commentService.getArticleComments(11L, pageable, null);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).isOwner()).isFalse();
    }

    @Test
    void deleteCommentTreeForSetup_walksRootsAndDeletesBottomUp() {
        Comment root = Comment.builder().id(1L).build();
        when(commentRepository.findBySetupIdAndParentCommentIsNull(10L)).thenReturn(List.of(root));
        when(commentRepository.findByParentCommentId(1L)).thenReturn(List.of());

        commentService.deleteCommentTreeForSetup(10L);

        verify(commentRepository).delete(root);
    }

    @Test
    void deleteCommentTreeForArticle_walksRootsAndDeletesBottomUp() {
        Comment root = Comment.builder().id(1L).build();
        when(commentRepository.findByArticleIdAndParentCommentIsNull(11L)).thenReturn(List.of(root));
        when(commentRepository.findByParentCommentId(1L)).thenReturn(List.of());

        commentService.deleteCommentTreeForArticle(11L);

        verify(commentRepository).delete(root);
    }

    @Test
    void createSetupComment_throwsWhenSetupNotFound() {
        User user = User.builder().id(1L).email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(setupRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createSetupComment(99L, "u@e", new CommentRequest("Text", null)))
                .isInstanceOf(RuntimeException.class);
        verify(commentRepository, never()).save(any());
    }

    @Test
    void createArticleComment_throwsWhenArticleNotFound() {
        User user = User.builder().id(1L).email("u@e").build();
        when(userRepository.findByEmail("u@e")).thenReturn(Optional.of(user));
        when(articleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createArticleComment(99L, "u@e", new CommentRequest("Text", null)))
                .isInstanceOf(RuntimeException.class);
        verify(commentRepository, never()).save(any());
    }

    @Test
    void deleteCommentTreeForSetup_handlesEmptyTree() {
        when(commentRepository.findBySetupIdAndParentCommentIsNull(10L)).thenReturn(List.of());

        commentService.deleteCommentTreeForSetup(10L);

        verify(commentRepository, never()).delete(any());
    }
}
