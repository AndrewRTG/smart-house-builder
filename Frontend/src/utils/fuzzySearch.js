/**
 * fuzzySearch — small dependency-free fuzzy matcher.
 *
 * Why we have this:
 *   The Community page used to filter setups/articles with plain
 *   `.includes()`, which fails the moment the user types a typo
 *   ("livng room") or searches across a non-contiguous substring
 *   ("smrtsec" should match "Smart Security Suite"). A real fuzzy matcher
 *   solves both cases without pulling in a 30-KB library like Fuse.js for
 *   what is, in this project, a single search bar.
 *
 * Algorithm — character-subsequence with a position-aware bonus:
 *   1. Lower-case both strings, strip diacritics.
 *   2. Walk the query character by character; for each query char find the
 *      next occurrence in the target after the previous match.
 *   3. If any query char can't be matched -> not a match (return null).
 *   4. Score = sum of per-match bonuses, where consecutive matches and
 *      matches at word boundaries score higher. Lower score = better.
 *      (We return a *positive* "score" with smaller = better so it sorts
 *       naturally with Array.prototype.sort.)
 *
 * This is the same shape Sublime Text / VS Code's command palette uses,
 * minus the bigram precomputation that doesn't pay off for our list sizes
 * (hundreds, not millions, of items).
 *
 * Usage:
 *   import { fuzzyFilter } from "../utils/fuzzySearch";
 *
 *   const results = fuzzyFilter(setups, "smrtsec", (s) => [s.name, s.description]);
 *   // results is the input list, filtered to matches and sorted best->worst.
 */

/**
 * Strip diacritics so "Cioarnă" matches "ciorna".
 * We use NFD normalization + a regex on the combining-marks block. Works in
 * every modern browser; no polyfill needed.
 */
function normalize(s) {
  if (s == null) return "";
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Score a single (target, query) pair. Returns:
 *   - null if query can't be matched as a subsequence of target
 *   - a finite number where SMALLER = BETTER match
 *
 * Score components (kept simple on purpose):
 *   +1  per "gap" character we had to skip in the target
 *   -3  if a match starts at index 0 of the target (huge prefix bonus)
 *   -2  if a match falls right after a word boundary (' ', '-', '_', '/', '.')
 *   -1  if two matches are consecutive in the target (run bonus)
 *   +0  for a baseline match in the middle of a word
 *
 * Net effect:
 *   query="liv"  vs "Living Room Pro"           ->  -3 (prefix)              best
 *   query="liv"  vs "Smart Living Room"         ->  -2 (after space)         next
 *   query="liv"  vs "Sliver Box"                ->   0 (mid-word)            worst
 */
function scoreMatch(target, query) {
  if (!query) return 0;
  const t = normalize(target);
  const q = normalize(query);
  if (!t) return null;
  if (q.length > t.length) return null;

  let score = 0;
  let ti = 0;             // pointer into target
  let lastMatchIndex = -2; // for the consecutive-run bonus
  for (let qi = 0; qi < q.length; qi++) {
    const want = q[qi];
    // Skip target chars until we hit `want`. Each skip is a +1 gap.
    let found = -1;
    while (ti < t.length) {
      if (t[ti] === want) { found = ti; break; }
      score += 1;
      ti += 1;
    }
    if (found === -1) return null; // ran off the end without matching

    // Bonuses
    if (found === 0) {
      score -= 3;
    } else {
      const prev = t[found - 1];
      const isBoundary = prev === " " || prev === "-" || prev === "_" || prev === "/" || prev === ".";
      if (isBoundary) score -= 2;
    }
    if (found === lastMatchIndex + 1) score -= 1;

    lastMatchIndex = found;
    ti = found + 1;
  }
  return score;
}

/**
 * Best score across multiple fields. Returns the lowest non-null score, or
 * null if none of the fields matched.
 */
function bestScore(fields, query) {
  let best = null;
  for (const f of fields) {
    const s = scoreMatch(f, query);
    if (s == null) continue;
    if (best == null || s < best) best = s;
  }
  return best;
}

/**
 * fuzzyFilter — keep items whose `getFields(item)` produces at least one
 * fuzzy match for `query`, sorted best -> worst. Empty/whitespace query
 * returns the input untouched (no sort).
 *
 * @param items     array of objects to search
 * @param query     user input
 * @param getFields (item) => string | string[]   which strings to match against
 */
export function fuzzyFilter(items, query, getFields) {
  if (!Array.isArray(items)) return [];
  const q = String(query || "").trim();
  if (!q) return items;

  const scored = [];
  for (const it of items) {
    let fields = getFields(it);
    if (!Array.isArray(fields)) fields = [fields];
    const s = bestScore(fields, q);
    if (s != null) scored.push({ item: it, score: s });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.map((x) => x.item);
}

// Lower-level exports, in case a caller wants the raw score (e.g. to render
// a relevance percentage in the UI later).
export { scoreMatch, bestScore, normalize };
