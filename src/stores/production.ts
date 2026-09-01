import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { MoneyAmount } from '@/types';
import { DEFAULT_VALUES, LIMITS, STORAGE_KEYS, type Currency } from '@/utils/constants';
import { readNumber, readRecord, readString, writeRecord } from '@/utils/persistence';
import { clampNumber } from '@/utils/calculations';
import { isCurrency } from '@/utils/currency';

interface PersistedProduction {
  costPerGram: number;
  currency: Currency;
}

function loadPersisted(): PersistedProduction {
  const stored = readRecord([STORAGE_KEYS.PRODUCTION]);
  const currency = readString(stored, ['currency']);

  return {
    costPerGram: readNumber(stored, ['costPerGram'], DEFAULT_VALUES.PRODUCTION_COST_PER_GRAM),
    currency: isCurrency(currency) ? currency : DEFAULT_VALUES.PRODUCTION_COST_CURRENCY,
  };
}

/**
 * Production cost covers machine time, wear and energy. It is configured once in
 * Settings as an amount per gram and multiplied by the weight of each piece.
 */
export const useProductionStore = defineStore('production', () => {
  const persisted = loadPersisted();

  const costPerGram = ref<number>(persisted.costPerGram);
  const currency = ref<Currency>(persisted.currency);

  watch([costPerGram, currency], () => {
    const payload: PersistedProduction = {
      costPerGram: costPerGram.value,
      currency: currency.value,
    };
    writeRecord(STORAGE_KEYS.PRODUCTION, payload);
  });

  const amountPerGram = computed<MoneyAmount>(() => ({
    value: clampNumber(costPerGram.value, 0, LIMITS.PRODUCTION_COST_PER_GRAM_MAX),
    currency: currency.value,
  }));

  return { costPerGram, currency, amountPerGram };
});
