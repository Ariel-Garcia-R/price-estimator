<script setup lang="ts">
import { computed } from 'vue';
import { useProductionStore } from '@/stores/production';
import { useRatesStore } from '@/stores/rates';
import { CURRENCY } from '@/utils/constants';
import { formatMoney } from '@/utils/currency';

const productionStore = useProductionStore();
const ratesStore = useRatesStore();

const rows = computed(() => [
  {
    label: 'Production cost',
    value: `${formatMoney(productionStore.costPerGram, productionStore.currency)} / g`,
  },
  {
    label: 'Dollar rate',
    value:
      ratesStore.dollarRateCUP > 0
        ? formatMoney(ratesStore.dollarRateCUP, CURRENCY.CUP)
        : 'Not set',
  },
]);
</script>

<template>
  <v-card variant="tonal">
    <v-card-text class="py-2">
      <div
        v-for="row in rows"
        :key="row.label"
        class="d-flex justify-space-between text-body-2 py-1"
      >
        <span class="text-medium-emphasis">{{ row.label }}</span>
        <span>{{ row.value }}</span>
      </div>
      <div class="text-caption text-medium-emphasis mt-1">
        Both are configured in Settings.
      </div>
    </v-card-text>
  </v-card>
</template>
