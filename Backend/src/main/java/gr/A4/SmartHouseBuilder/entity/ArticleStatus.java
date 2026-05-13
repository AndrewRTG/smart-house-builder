package gr.A4.SmartHouseBuilder.entity;

/**
 * Lifecycle stage of an Article. Mirrors SetupStatus but kept as a
 * separate type so the two domains can evolve independently (e.g. an
 * article could later get an ARCHIVED state without dragging Setup with it).
 *
 * - DRAFT     — author can keep iterating, not visible in the community feed
 * - PUBLISHED — visible in the community feed, can still be edited (unlike Setup
 *               which is immutable once published)
 */
public enum ArticleStatus {
    DRAFT,
    PUBLISHED
}
