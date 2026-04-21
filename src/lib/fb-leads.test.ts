import { describe, it, expect } from 'vitest';
import { daysAgo } from './fb-leads';

describe('daysAgo', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(daysAgo(today)).toBe(0);
  });

  it('returns correct days for a past date', () => {
    const past = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(daysAgo(past)).toBe(35);
  });

  it('returns 30 for exactly 30 days ago', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(daysAgo(past)).toBe(30);
  });
});
