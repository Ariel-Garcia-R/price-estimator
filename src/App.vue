<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';

const router = useRouter();
const theme = useTheme();

const isDark = computed(() => theme.current.value.dark);
const themeIcon = computed(() =>
  isDark.value ? 'mdi-weather-night' : 'mdi-white-balance-sunny',
);

function goTo(path: string) {
  router.push(path);
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>FunnelPrint 3D</v-app-bar-title>
      <template #append>
        <v-btn
          icon="mdi-cog-outline"
          aria-label="Settings"
          @click="goTo('/settings')"
        />
        <v-btn
          :icon="themeIcon"
          aria-label="Toggle light / dark theme"
          @click="theme.toggle()"
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
