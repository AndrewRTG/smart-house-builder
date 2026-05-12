import { describe, expect, it } from 'vitest';
import { bestScore, fuzzyFilter, normalize, scoreMatch } from './fuzzySearch';

describe('fuzzySearch', () => {
  it('normalizes diacritics and casing', () => {
    expect(normalize('Cioarnă SMART')).toBe('cioarna smart');
    expect(normalize(null)).toBe('');
  });

  it('returns null when query is not a subsequence', () => {
    expect(scoreMatch('Smart Security Suite', 'zzz')).toBeNull();
  });

  it('prefers prefix matches over mid-word matches', () => {
    const prefixScore = scoreMatch('Living Room Pro', 'liv');
    const midWordScore = scoreMatch('Sliver Box', 'liv');

    expect(prefixScore).toBeLessThan(midWordScore);
  });

  it('uses the best matching field across multiple fields', () => {
    const score = bestScore(['boring title', 'Smart Security Suite'], 'smrtsec');

    expect(score).not.toBeNull();
  });

  it('filters and sorts items by match quality', () => {
    const items = [
      { name: 'Sliver Box', description: 'misc' },
      { name: 'Living Room Pro', description: 'starter pack' },
      { name: 'Smart Security Suite', description: 'alarms everywhere' },
    ];

    const results = fuzzyFilter(items, 'liv', (item) => [item.name, item.description]);

    expect(results.map((item) => item.name)).toEqual([
      'Living Room Pro',
      'Sliver Box',
    ]);
  });

  it('returns input untouched for empty queries and empty array for invalid items', () => {
    const items = [{ id: 1 }, { id: 2 }];

    expect(fuzzyFilter(items, '   ', (item) => item.id)).toBe(items);
    expect(fuzzyFilter(null, 'abc', () => [])).toEqual([]);
  });
});
