package gr.A4.SmartHouseBuilder.service;

import gr.A4.SmartHouseBuilder.entity.Article;
import gr.A4.SmartHouseBuilder.entity.ArticleStatus;
import gr.A4.SmartHouseBuilder.entity.Setup;
import gr.A4.SmartHouseBuilder.entity.SetupStatus;
import gr.A4.SmartHouseBuilder.repository.ArticleRepository;
import gr.A4.SmartHouseBuilder.repository.SetupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentModerationWorker {
    private final ArticleRepository articleRepository;
    private final SetupRepository setupRepository;
    private final BadWordFilterService badWordFilterService;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void scanPublicContentDaily() {
        int flaggedArticles = scanArticles();
        int flaggedSetups = scanSetups();

        log.info("Daily content moderation finished. Flagged articles: {}, flagged setups: {}",
                flaggedArticles, flaggedSetups);
    }

    int scanArticles() {
        List<Article> articles = articleRepository.findByStatus(ArticleStatus.PUBLISHED);
        int flagged = 0;

        for (Article article : articles) {
            String text = buildArticleText(article);

            if (badWordFilterService.containsBadWords(text)) {
                article.setStatus(ArticleStatus.FLAGGED);
                flagged++;
            }
        }

        return flagged;
    }

    int scanSetups() {
        List<Setup> setups = setupRepository.findByPublicSetupTrueAndStatus(SetupStatus.PUBLISHED);
        int flagged = 0;

        for (Setup setup : setups) {
            String text = buildSetupText(setup);

            if (badWordFilterService.containsBadWords(text)) {
                setup.setStatus(SetupStatus.FLAGGED);
                flagged++;
            }
        }

        return flagged;
    }

    private String buildArticleText(Article article) {
        return String.join(" ",
                safe(article.getTitle()),
                safe(article.getContent()),
                safe(article.getTags())
        );
    }

    private String buildSetupText(Setup setup) {
        return String.join(" ",
                safe(setup.getName()),
                safe(setup.getDescription())
        );
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}