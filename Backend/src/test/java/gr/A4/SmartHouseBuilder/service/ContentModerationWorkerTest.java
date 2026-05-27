package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.ArticleStatus;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentModerationWorkerTest {

    @Mock private ArticleRepository articleRepository;
    @Mock private SetupRepository setupRepository;
    @Mock private BadWordFilterService badWordFilterService;

    @InjectMocks private ContentModerationWorker worker;

    @Test
    void scanArticlesFlagsPublishedArticlesWithBadWords() {
        Article clean = Article.builder()
                .id(1L)
                .title("Clean title")
                .content("Useful content")
                .tags("safe,home")
                .status(ArticleStatus.PUBLISHED)
                .build();
        Article flagged = Article.builder()
                .id(2L)
                .title("Bad title")
                .content("Bad content")
                .tags(null)
                .status(ArticleStatus.PUBLISHED)
                .build();
        when(articleRepository.findByStatus(ArticleStatus.PUBLISHED)).thenReturn(List.of(clean, flagged));
        when(badWordFilterService.containsBadWords("Clean title Useful content safe,home")).thenReturn(false);
        when(badWordFilterService.containsBadWords("Bad title Bad content ")).thenReturn(true);

        int result = worker.scanArticles();

        assertThat(result).isEqualTo(1);
        assertThat(clean.getStatus()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(flagged.getStatus()).isEqualTo(ArticleStatus.FLAGGED);
    }

    @Test
    void scanSetupsFlagsPublicPublishedSetupsWithBadWords() {
        Setup clean = Setup.builder()
                .id(10L)
                .name("Living room")
                .description(null)
                .publicSetup(true)
                .status(SetupStatus.PUBLISHED)
                .build();
        Setup flagged = Setup.builder()
                .id(11L)
                .name("Kitchen")
                .description("Bad setup description")
                .publicSetup(true)
                .status(SetupStatus.PUBLISHED)
                .build();
        when(setupRepository.findByPublicSetupTrueAndStatus(SetupStatus.PUBLISHED)).thenReturn(List.of(clean, flagged));
        when(badWordFilterService.containsBadWords("Living room ")).thenReturn(false);
        when(badWordFilterService.containsBadWords("Kitchen Bad setup description")).thenReturn(true);

        int result = worker.scanSetups();

        assertThat(result).isEqualTo(1);
        assertThat(clean.getStatus()).isEqualTo(SetupStatus.PUBLISHED);
        assertThat(flagged.getStatus()).isEqualTo(SetupStatus.FLAGGED);
    }

    @Test
    void scanPublicContentDailyRunsBothScans() {
        when(articleRepository.findByStatus(ArticleStatus.PUBLISHED)).thenReturn(List.of());
        when(setupRepository.findByPublicSetupTrueAndStatus(SetupStatus.PUBLISHED)).thenReturn(List.of());

        worker.scanPublicContentDaily();

        verify(articleRepository).findByStatus(ArticleStatus.PUBLISHED);
        verify(setupRepository).findByPublicSetupTrueAndStatus(SetupStatus.PUBLISHED);
    }
}
