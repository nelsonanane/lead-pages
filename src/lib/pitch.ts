import Anthropic from '@anthropic-ai/sdk';

interface ListingContext {
  price: number | null;
  bedrooms: number | null;
  location: string;
}

export async function generatePitch(listing: ListingContext): Promise<string> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });

  const bedroomStr = listing.bedrooms ? `${listing.bedrooms}-bedroom` : 'your';
  const locationStr = listing.location || 'Charlotte';
  const priceStr = listing.price
    ? `$${listing.price.toLocaleString()}/month`
    : 'your asking price';

  const prompt = `Write a short, professional Facebook Messenger outreach message from Nelson at Kwesi Holdings & Management to a landlord whose rental listing has been up for 30+ days.

Property details:
- Bedrooms: ${listing.bedrooms ?? 'not specified'}
- Location: ${locationStr}
- Asking price: ${priceStr}

The message must:
1. Open with "Hi there" (no name available)
2. Identify as Nelson with Kwesi Holdings & Management
3. Reference the specific property (${bedroomStr} in ${locationStr})
4. Explain the model: long-term lease, guaranteed rent each month, used for vetted traveling professionals and extended-stay occupants
5. List what Kwesi handles: furnishing if needed, utilities, routine cleaning, guest communication, upkeep
6. Reference ${priceStr} to show it works for the model
7. End with a call to action for a quick call or walkthrough
8. Sign off as: Nelson, Kwesi Holdings & Management

No em dashes. Under 200 words. Direct and warm.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');
  return content.text.trim();
}
