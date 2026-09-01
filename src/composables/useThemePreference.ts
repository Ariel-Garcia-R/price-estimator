import { computed, ref } from 'vue';
import { useTheme } from 'vuetify';
import {
  loadThemePreference,
  nextThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/utils/theme';

/**
 * Shared at module level so every consumer observes the same preference.
 * Initialised from localStorage, matching the `defaultTheme` that was handed to
 * `createVuetify`, so the composable and Vuetify never start out disagreeing.
 */
const preference = ref<ThemePreference>(loadThemePreference());

const ICONS: Record<ThemePreference, string> = {
  system: 'mdi-theme-light-dark',
  light: 'mdi-white-balance-sunny',
  dark: 'mdi-weather-night',
};

const LABELS: Record<ThemePreference, string> = {
  system: 'Theme: system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

export function useThemePreference() {
  const theme = useTheme();

  /**
   * Resolved darkness. When the preference is `system` this tracks the OS
   * setting reactively, because Vuetify watches `prefers-color-scheme`.
   */
  const isDark = computed(() => theme.current.value.dark);
  const isSystem = computed(() => preference.value === 'system');
  const icon = computed(() => ICONS[preference.value]);
  const label = computed(() => LABELS[preference.value]);

  function set(next: ThemePreference) {
    preference.value = next;
    // `change` accepts 'system' and resolves it against prefers-color-scheme.
    theme.change(next);
    saveThemePreference(next);
  }

  /**
   * Cycles system -> light -> dark -> system.
   *
   * Vuetify's own `theme.cycle()` cannot be used here: it compares against
   * `theme.name`, which already resolves 'system' to 'light'/'dark', so a
   * ['system', 'light', 'dark'] array would skip a state and never settle back
   * on 'system'.
   */
  function cycle() {
    set(nextThemePreference(preference.value));
  }

  return { preference, isDark, isSystem, icon, label, set, cycle };
}
