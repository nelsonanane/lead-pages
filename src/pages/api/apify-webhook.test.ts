import { describe, it, expect } from 'vitest';
import { parsePrice, parseBedrooms } from './apify-webhook';

describe('parsePrice', () => {
  it('returns a number when given a number', () => {
    expect(parsePrice(1800)).toBe(1800);
  });

  it('strips currency symbols and commas from strings', () => {
    expect(parsePrice('$1,800/month')).toBe(1800);
  });

  it('returns null for undefined', () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it('returns null for unparseable strings', () => {
    expect(parsePrice('contact for price')).toBeNull();
  });
});

describe('parseBedrooms', () => {
  it('returns a number from a number', () => {
    expect(parseBedrooms(3)).toBe(3);
  });

  it('parses integer from string', () => {
    expect(parseBedrooms('3 bd')).toBe(3);
  });

  it('returns null for undefined', () => {
    expect(parseBedrooms(undefined)).toBeNull();
  });
});
