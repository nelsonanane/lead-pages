import { describe, it, expect } from 'vitest';
import { parsePrice, parseBedrooms, parseLocation } from './apify-webhook';

describe('parsePrice', () => {
  it('returns a number when given a number', () => {
    expect(parsePrice(1800)).toBe(1800);
  });

  it('strips currency symbols and commas from strings', () => {
    expect(parsePrice('$1,800/month')).toBe(1800);
  });

  it('parses Apify clean decimal string', () => {
    expect(parsePrice('550.00')).toBe(550);
  });

  it('returns null for undefined', () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it('returns null for unparseable strings', () => {
    expect(parsePrice('contact for price')).toBeNull();
  });
});

describe('parseBedrooms', () => {
  it('extracts bedrooms from Apify custom_title', () => {
    expect(parseBedrooms('1 bed · 1 bath')).toBe(1);
  });

  it('extracts bedrooms from full title', () => {
    expect(parseBedrooms('3 Bed 2 Bath House')).toBe(3);
  });

  it('returns null for undefined', () => {
    expect(parseBedrooms(undefined)).toBeNull();
  });

  it('returns null when no bedroom info', () => {
    expect(parseBedrooms('Studio apartment')).toBeNull();
  });
});

describe('parseLocation', () => {
  it('extracts city and state from Apify reverse_geocode', () => {
    expect(parseLocation({ reverse_geocode: { city: 'Charlotte', state: 'NC' } })).toBe('Charlotte, NC');
  });

  it('returns empty string for null', () => {
    expect(parseLocation(null)).toBe('');
  });

  it('returns string as-is', () => {
    expect(parseLocation('Charlotte, NC')).toBe('Charlotte, NC');
  });
});
