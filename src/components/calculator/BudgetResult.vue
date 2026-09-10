<script setup lang="ts">
import { computed } from 'vue';
import { useBudgetStore } from '@/stores/budget';
import { CURRENCY } from '@/utils/constants';
import { round } from '@/utils/calculations';

const budgetStore = useBudgetStore();

const hasResult = computed(
  () => budgetStore.result.subtotalCUP > 0 || budgetStore.result.paintLaborCostCUP > 0,
);

const breakdown = computed(() => {
  const rows = [
    {
      label: budgetStore.selectedMaterial
        ? `Material (${budgetStore.selectedMaterial.name})`
        : 'Material',
      value: round(budgetStore.result.materialCostCUP),
    },
    {
      label: 'Production',
      value: round(budgetStore.result.productionCostCUP),
    },
    {
      label: `Safety margin (${budgetStore.safetyPercent}%)`,
      value: round(budgetStore.result.safetyAmountCUP),
    },
  ];

  if (budgetStore.requiresPainting) {
    rows.push({
      label: 'Paint labor',
      value: round(budgetStore.result.paintLaborCostCUP),
    });
  }

  return rows;
});
</script>

<template>
  <v-card>
    <v-card-title>Result</v-card-title>
    <v-card-text>
      <v-alert
        v-if="budgetStore.result.requiresDollarRate"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Some prices are in USD. Set the dollar exchange rate in Settings to get the
        price in CUP.
      </v-alert>

      <v-list v-if="hasResult">
        <v-list-item
          v-for="item in breakdown"
          :key="item.label"
        >
          <template #title>
            {{ item.label }}
          </template>
          <template #append>
            <strong>{{ item.value.toFixed(2) }} {{ CURRENCY.CUP }}</strong>
          </template>
        </v-list-item>
        <v-divider class="my-2" />
        <v-list-item>
          <template #title>
            <strong>Final price</strong>
          </template>
          <template #append>
            <strong class="text-primary text-h6">
              {{ budgetStore.result.totalCUP.toFixed(2) }} {{ CURRENCY.CUP }}
            </strong>
          </template>
        </v-list-item>
        <v-list-item>
          <template #title>
            Equivalent in USD
          </template>
          <template #append>
            <strong>
              {{ budgetStore.result.totalUSD.toFixed(2) }} {{ CURRENCY.USD }}
            </strong>
          </template>
        </v-list-item>
      </v-list>
      <v-alert
        v-else-if="!budgetStore.result.requiresDollarRate"
        type="info"
        variant="tonal"
      >
        Enter the weight of the piece to see the price.
      </v-alert>
    </v-card-text>
  </v-card>
</template>
