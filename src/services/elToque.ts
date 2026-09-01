const ELTOQUE_URL = 'https://tasas.eltoque.com/v1/trmi';

/** Free token available at https://tasas-token.eltoque.com/ */
export const ELTOQUE_TOKEN = import.meta.env.VITE_ELTOQUE_TOKEN ?? '';

export interface ElToqueRates {
  USD?: number;
  MLC?: number;
  ECU?: number;
}

export interface ElToqueResponse {
  /** Upstream API wire field name — kept in Spanish on purpose. */
  tasas: ElToqueRates;
  date?: string;
  hour?: number;
  minutes?: number;
  seconds?: number;
}

function formatLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildRangeParams(now: Date): URLSearchParams {
  const from = new Date(now.getTime() - 23 * 60 * 60 * 1000);
  const params = new URLSearchParams();
  params.set('date_from', formatLocalDate(from));
  params.set('date_to', formatLocalDate(now));
  return params;
}

export async function fetchElToqueDollarRate(now = new Date()): Promise<number> {
  if (!ELTOQUE_TOKEN) {
    throw new Error('El Toque token is not configured. Add it as VITE_ELTOQUE_TOKEN.');
  }

  const params = buildRangeParams(now);
  const response = await fetch(`${ELTOQUE_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${ELTOQUE_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`El Toque responded with status ${response.status}`);
  }

  const data: ElToqueResponse = await response.json();
  const usd = data.tasas?.USD;

  if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) {
    throw new Error('The El Toque API did not return a valid USD rate');
  }

  return usd;
}
