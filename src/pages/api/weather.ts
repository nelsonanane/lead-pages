import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat') || '35.2271';
  const lon = url.searchParams.get('lon') || '-80.8431';
  const apiKey = import.meta.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ city: 'Charlotte, NC', temp: '--', condition: 'Weather key not set' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const data = await res.json();

    return new Response(
      JSON.stringify({
        city: data.name,
        temp: Math.round(data.main?.temp),
        feels_like: Math.round(data.main?.feels_like),
        condition: data.weather?.[0]?.description ?? '',
        humidity: data.main?.humidity,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ city: 'Charlotte, NC', temp: '--', condition: 'Unavailable' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};
