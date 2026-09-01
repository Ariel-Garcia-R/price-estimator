<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemePreference } from '@/composables/useThemePreference';
import { APP_NAME } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const { icon: themeIcon, label: themeLabel, cycle: cycleTheme } = useThemePreference();

const isHome = computed(() => route.name === 'calculator');

/**
 * Navigates to a known route rather than calling `router.back()`, which would
 * leave the app when Settings was opened directly from a deep link. In an
 * installed PWA there is no browser back button, so this is the only way out.
 */
function goHome() {
  router.push({ name: 'calculator' });
}

function goToSettings() {
  router.push({ name: 'settings' });
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <template
        v-if="!isHome"
        #prepend
      >
        <v-btn
          icon="mdi-arrow-left"
          aria-label="Back to calculator"
          @click="goHome"
        />
      </template>

      <v-app-bar-title>{{ APP_NAME }}</v-app-bar-title>

      <template #append>
        <v-btn
          v-if="isHome"
          icon="mdi-cog-outline"
          aria-label="Settings"
          @click="goToSettings"
        />
        <v-btn
          :icon="themeIcon"
          :aria-label="themeLabel"
          :title="themeLabel"
          @click="cycleTheme"
        />
      </template>
    </v-app-bar>

    <v-main>
      <v-container class="page-container">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.page-container {
  max-width: 640px;
}
</style>
