/**
 * Helpers for reading values out of untrusted `localStorage` JSON.
 *
 * Each reader accepts several candidate keys so that payloads written by an
 * earlier version of the app (which used Spanish field names) are still
 * readable after the migration to English identifiers.
 */

export function parseJsonRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readNumber(
  source: Record<string, unknown> | null,
  keys: readonly string[],
  fallback: number,
): number {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

export function readString(
  source: Record<string, unknown> | null,
  keys: readonly string[],
): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}
