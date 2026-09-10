/**
 * Helpers for reading and writing untrusted `localStorage` JSON.
 *
 * Readers accept several candidate keys so that payloads written by earlier
 * versions of the app stay readable:
 *  - storage keys were prefixed `funnelprint_` before the rename;
 *  - object fields used Spanish names before the migration to English.
 */

/** `localStorage` throws in private modes and when quota is exceeded. */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRecord(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; ignore quota and private-mode failures.
  }
}

export function readRawString(keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = safeGetItem(key);
    if (value !== null) return value;
  }
  return null;
}

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

/** Reads the first key that holds a parseable JSON object. */
export function readRecord(keys: readonly string[]): Record<string, unknown> | null {
  for (const key of keys) {
    const record = parseJsonRecord(safeGetItem(key));
    if (record) return record;
  }
  return null;
}

/** Reads the first key that holds a parseable JSON array. */
export function readArray(keys: readonly string[]): unknown[] | null {
  for (const key of keys) {
    const raw = safeGetItem(key);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Ignore malformed entries and try the next candidate key.
    }
  }
  return null;
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

export function readBoolean(
  source: Record<string, unknown> | null,
  keys: readonly string[],
  fallback: boolean,
): boolean {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
  }
  return fallback;
}
