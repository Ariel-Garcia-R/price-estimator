<script setup lang="ts">
import { computed } from 'vue';
import { useBudgetStore } from '@/stores/budget';
import { useRatesStore } from '@/stores/rates';
import { CURRENCY } from '@/utils/constants';
import { round } from '@/utils/calculations';

const budgetStore = useBudgetStore();
const ratesStore = useRatesStore();

const hasResult = computed(() => budgetStore.result.sellingPriceCUP > 0);

const breakdown = computed(() => [
  {
    label: 'Filament cost',
    value: round(budgetStore.result.filamentCostCUP),
    currency: CURRENCY.CUP,
  },
  {
    label: 'Base cost (with margin)',
    value: round(budgetStore.result.baseCostCUP),
    currency: CURRENCY.CUP,
  },
]);
</script>

<template>
  <v-card class="mt-4">
    <v-card-title>Budget calculator</v-card-title>
    <v-card-text>
      <v-text-field
        v-model.number="budgetStore.modelWeightGrams"
        type="number"
        min="0"
        label="Model weight (grams)"
        suffix="g"
      />
      <v-text-field
        v-model.number="budgetStore.filamentPricePerKiloCUP"
        type="number"
        min="0"
        label="Price per kilo of filament"
        prefix="CUP"
      />
      <v-text-field
        v-model.number="budgetStore.marginPercent"
        type="number"
        min="0"
        label="Profit margin"
        suffix="%"
      />
    </v-card-text>
  </v-card>

  <v-card class="mt-4">
    <v-card-title>Dollar exchange rate</v-card-title>
    <v-card-text>
      <v-text-field
        :model-value="String(ratesStore.dollarRateCUP)"
        type="number"
        min="0"
        label="Dollar price in CUP"
        readonly
        hint="Edit it in Settings"
        persistent-hint
      />
    </v-card-text>
  </v-card>

  <v-card class="mt-4">
    <v-card-title>Result</v-card-title>
    <v-card-text>
      <v-list v-if="hasResult">
        <v-list-item
          v-for="item in breakdown"
          :key="item.label"
        >
          <template #title>
            {{ item.label }}
          </template>
          <template #append>
            <strong>{{ item.value.toFixed(2) }} {{ item.currency }}</strong>
          </template>
        </v-list-item>
        <v-divider class="my-2" />
        <v-list-item>
          <template #title>
            <strong>Selling price</strong>
          </template>
          <template #append>
            <strong class="text-primary text-h6">
              {{ budgetStore.result.sellingPriceCUP.toFixed(2) }} {{ CURRENCY.CUP }}
            </strong>
          </template>
        </v-list-item>
        <v-list-item>
          <template #title>
            Equivalent in USD
          </template>
          <template #append>
            <strong>
              {{ budgetStore.result.sellingPriceUSD.toFixed(2) }} {{ CURRENCY.USD }}
            </strong>
          </template>
        </v-list-item>
      </v-list>
      <v-alert
        v-else
        type="info"
        variant="tonal"
      >
        Fill in the fields to see the budget.
      </v-alert>
    </v-card-text>
  </v-card>
</template>
