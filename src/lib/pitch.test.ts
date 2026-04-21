import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCreate = vi.fn().mockResolvedValue({
  choices: [{ message: { content: 'Hi there, this is Nelson with Kwesi Holdings.' } }],
});

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = { completions: { create: mockCreate } };
      constructor(config: { apiKey: string }) {
        this.chat = { completions: { create: mockCreate } };
      }
    },
  };
});

beforeEach(() => {
  mockCreate.mockClear();
});

describe('generatePitch', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when OPENAI_API_KEY is missing', async () => {
    const { generatePitch } = await import('./pitch');
    await expect(
      generatePitch({ price: null, bedrooms: null, location: '' })
    ).rejects.toThrow('OPENAI_API_KEY not set');
  });

  it('returns a non-empty string with valid context and env var', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
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
