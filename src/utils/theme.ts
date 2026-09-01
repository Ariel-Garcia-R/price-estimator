import { STORAGE_KEYS } from '@/utils/constants';
import { readRawString } from '@/utils/persistence';

/**
 * `system` follows the OS `prefers-color-scheme` setting and is the default for
 * a first-time visitor. `light` and `dark` are explicit user overrides.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

/** Order used when cycling with the app-bar button. */
export const THEME_PREFERENCE_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function loadThemePreference(): ThemePreference {
  const stored = readRawString([STORAGE_KEYS.THEME]);
  return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, preference);
  } catch {
    // Best-effort only; the in-memory preference still applies.
  }
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCE_ORDER.indexOf(current);
  return THEME_PREFERENCE_ORDER[(index + 1) % THEME_PREFERENCE_ORDER.length];
}
