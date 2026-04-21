import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Hi there, this is Nelson with Kwesi Holdings.' }],
});

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = { create: mockCreate };
      constructor(config: { apiKey: string }) {
        this.messages = { create: mockCreate };
      }
    },
  };
});

beforeEach(() => {
  mockCreate.mockClear();
});

describe('generatePitch', () => {
  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    const { generatePitch } = await import('./pitch');
    // No env var set — should throw
    await expect(
      generatePitch({ price: null, bedrooms: null, location: '' })
    ).rejects.toThrow('ANTHROPIC_API_KEY not set');
  });

  it('returns a non-empty string with valid context and env var', async () => {
    // Set the env var for this test
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    const { generatePitch } = await import('./pitch');
    const result = await generatePitch({
      price: 1800,
      bedrooms: 3,
      location: 'South End, Charlotte',
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
