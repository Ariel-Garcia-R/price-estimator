/**
 * Vercel serverless proxy for the El Toque informal exchange rate API.
 *
 * This must run server-side for two reasons:
 *  1. tasas.eltoque.com sends no `Access-Control-Allow-Origin` header, and the
 *     required `Authorization` header triggers a CORS preflight, so a direct
 *     browser call is always blocked.
 *  2. It keeps `ELTOQUE_TOKEN` out of the client bundle. The variable is
 *     deliberately NOT prefixed with `VITE_` so Vite can never inline it.
 */

const ELTOQUE_URL = 'https://tasas.eltoque.com/v1/trmi';

/** El Toque expects Cuba-local timestamps; Vercel functions run in UTC. */
const ELTOQUE_TIME_ZONE = 'America/Havana';

const LOOKBACK_HOURS = 23;

interface ElToqueResponse {
  tasas?: { USD?: number; MLC?: number; ECU?: number };
  date?: string;
}

function json(body: unknown, status: number, cacheSeconds = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control':
        cacheSeconds > 0
          ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`
          : 'no-store',
    },
  });
}

/** Formats a date as `YYYY-MM-DD HH:mm:ss` in Cuba local time. */
function formatHavanaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ELTOQUE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  // `en-CA` with hour12:false can yield "24" for midnight; normalise it.
  const hour = get('hour') === '24' ? '00' : get('hour');

  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const token = process.env.ELTOQUE_TOKEN;
  if (!token) {
    return json(
      { error: 'The server is missing the ELTOQUE_TOKEN environment variable.' },
      500,
    );
  }

  const now = new Date();
  const params = new URLSearchParams({
    date_from: formatHavanaDate(new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000)),
    date_to: formatHavanaDate(now),
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${ELTOQUE_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return json({ error: 'Could not reach the El Toque API.' }, 504);
  }

  if (!upstream.ok) {
    return json({ error: `El Toque responded with status ${upstream.status}` }, 502);
  }

  let data: ElToqueResponse;
  try {
    data = (await upstream.json()) as ElToqueResponse;
  } catch {
    return json({ error: 'The El Toque API returned a malformed response.' }, 502);
  }

  const usd = data.tasas?.USD;
  if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) {
    return json({ error: 'The El Toque API did not return a valid USD rate.' }, 502);
  }

  // Rates move slowly; cache at the edge to avoid hammering the upstream API.
  return json({ usd, updatedAt: new Date().toISOString() }, 200, 900);
}
