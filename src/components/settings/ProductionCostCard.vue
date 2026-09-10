<script setup lang="ts">
import { useProductionStore } from '@/stores/production';
import { CURRENCY_OPTIONS, LIMITS } from '@/utils/constants';

const productionStore = useProductionStore();

const productionCostRules = [
  (value: number) =>
    Number.isFinite(value) && value >= LIMITS.PRODUCTION_COST_PER_GRAM_MIN
      ? true
      : `Must be at least ${LIMITS.PRODUCTION_COST_PER_GRAM_MIN}`,
];
</script>

<template>
  <v-card>
    <v-card-title>Production cost</v-card-title>
    <v-card-text>
      <v-text-field
        v-model.number="productionStore.costPerGram"
        type="number"
        :min="LIMITS.PRODUCTION_COST_PER_GRAM_MIN"
        step="0.01"
        label="Cost per gram"
        suffix="/ g"
        hint="Machine time, wear and energy"
        persistent-hint
        :rules="productionCostRules"
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
