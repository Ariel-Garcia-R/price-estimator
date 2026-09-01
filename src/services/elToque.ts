/**
 * Client for the app's own rate endpoint.
 *
 * The El Toque API is NOT called directly from the browser: it sends no
 * `Access-Control-Allow-Origin` header and the required `Authorization` header
 * forces a CORS preflight, so the browser blocks it. The request is proxied by
 * `api/eltoque-rate.ts`, which also keeps the API token off the client.
 */

const RATE_ENDPOINT = '/api/eltoque-rate';

interface RateSuccess {
  usd: number;
  updatedAt: string;
}

interface RateFailure {
  error: string;
}

function isRateSuccess(value: unknown): value is RateSuccess {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RateSuccess>;
  return typeof candidate.usd === 'number' && Number.isFinite(candidate.usd) && candidate.usd > 0;
}

function readError(value: unknown, fallback: string): string {
  if (typeof value === 'object' && value !== null) {
    const candidate = value as Partial<RateFailure>;
    if (typeof candidate.error === 'string' && candidate.error.length > 0) {
      return candidate.error;
    }
  }
  return fallback;
}

export async function fetchElToqueDollarRate(): Promise<number> {
  let response: Response;
  try {
    response = await fetch(RATE_ENDPOINT, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('Network error while fetching the exchange rate.');
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Fall through to the status-based error below.
  }

  if (!response.ok) {
    throw new Error(readError(payload, `The rate service responded with status ${response.status}`));
  }

  if (!isRateSuccess(payload)) {
    throw new Error(readError(payload, 'The rate service did not return a valid USD rate.'));
  }

  return payload.usd;
}
