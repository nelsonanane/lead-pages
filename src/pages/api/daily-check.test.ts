import { describe, it, expect } from 'vitest';
import { isStale } from './daily-check';

describe('isStale', () => {
  it('returns true for a listing 30 days old with no pitch', () => {
    const firstSeen = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(isStale({ firstSeen, pitch: '' })).toBe(true);
  });

  it('returns false for a listing 29 days old', () => {
    const firstSeen = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(isStale({ firstSeen, pitch: '' })).toBe(false);
  });

  it('returns false when pitch already exists', () => {
    const firstSeen = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(isStale({ firstSeen, pitch: 'Hi there...' })).toBe(false);
  });
});
