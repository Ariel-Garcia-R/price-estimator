import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { loadThemePreference } from '@/utils/theme';

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    // Resolved before the app mounts so there is no flash of the wrong theme.
    // Falls back to 'system', which Vuetify maps to prefers-color-scheme and
    // keeps in sync with OS changes at runtime.
    defaultTheme: loadThemePreference(),
    themes: {
      light: {
        colors: {
          primary: '#1867c0',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#1867c0',
        },
      },
    },
  },
});
