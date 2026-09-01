<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useThemePreference } from '@/composables/useThemePreference';
import { APP_NAME } from '@/utils/constants';

const router = useRouter();
const { icon: themeIcon, label: themeLabel, cycle: cycleTheme } = useThemePreference();

function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>{{ APP_NAME }}</v-app-bar-title>
      <template #append>
        <v-btn
          icon="mdi-cog-outline"
          aria-label="Settings"
          @click="goTo('/settings')"
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
