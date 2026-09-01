<script setup lang="ts">
import { useProductionStore } from '@/stores/production';
import { CURRENCY_OPTIONS } from '@/utils/constants';

const productionStore = useProductionStore();
</script>

<template>
  <v-card>
    <v-card-title>Production cost</v-card-title>
    <v-card-text>
      <v-text-field
        v-model.number="productionStore.costPerGram"
        type="number"
        min="0"
        step="0.01"
        label="Cost per gram"
        suffix="/ g"
        hint="Machine time, wear and energy"
        persistent-hint
      />
      <v-select
        v-model="productionStore.currency"
        :items="CURRENCY_OPTIONS"
        label="Currency"
        class="mt-4"
      />
    </v-card-text>
  </v-card>
</template>
