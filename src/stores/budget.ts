import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { DEFAULT_VALUES, LEGACY_STORAGE_KEYS, LIMITS, STORAGE_KEYS } from '@/utils/constants';
import { readRecord, readNumber, writeRecord } from '@/utils/persistence';
import { calculateBudget, clampNumber } from '@/utils/calculations';
import { useRatesStore } from '@/stores/rates';

interface PersistedPreferences {
  modelWeightGrams: number;
  filamentPricePerKiloCUP: number;
  marginPercent: number;
}

const DEFAULT_PREFERENCES: PersistedPreferences = {
  modelWeightGrams: DEFAULT_VALUES.MODEL_WEIGHT_GRAMS,
  filamentPricePerKiloCUP: DEFAULT_VALUES.FILAMENT_PRICE_PER_KILO_CUP,
  marginPercent: DEFAULT_VALUES.MARGIN_PERCENT,
};

function loadPreferences(): PersistedPreferences {
  const stored = readRecord([STORAGE_KEYS.PREFERENCES, LEGACY_STORAGE_KEYS.PREFERENCES]);
  if (!stored) return { ...DEFAULT_PREFERENCES };

  return {
    modelWeightGrams: readNumber(
      stored,
      ['modelWeightGrams', 'pesoModeloGramos'],
      DEFAULT_PREFERENCES.modelWeightGrams,
    ),
    filamentPricePerKiloCUP: readNumber(
      stored,
      ['filamentPricePerKiloCUP', 'precioFilamentoKiloCUP'],
      DEFAULT_PREFERENCES.filamentPricePerKiloCUP,
    ),
    marginPercent: readNumber(
      stored,
      ['marginPercent', 'porcientoMargen'],
      DEFAULT_PREFERENCES.marginPercent,
    ),
  };
}

export const useBudgetStore = defineStore('budget', () => {
  const preferences = loadPreferences();

  const modelWeightGrams = ref(preferences.modelWeightGrams);
  const filamentPricePerKiloCUP = ref(preferences.filamentPricePerKiloCUP);
  const marginPercent = ref(preferences.marginPercent);

  watch([modelWeightGrams, filamentPricePerKiloCUP, marginPercent], () => {
    const payload: PersistedPreferences = {
      modelWeightGrams: modelWeightGrams.value,
      filamentPricePerKiloCUP: filamentPricePerKiloCUP.value,
      marginPercent: marginPercent.value,
    };
    writeRecord(STORAGE_KEYS.PREFERENCES, payload);
  });

  const ratesStore = useRatesStore();

  const result = computed(() =>
    calculateBudget({
      modelWeightGrams: clampNumber(modelWeightGrams.value, 0, LIMITS.MODEL_WEIGHT_GRAMS_MAX),
      filamentPricePerKiloCUP: clampNumber(
        filamentPricePerKiloCUP.value,
        0,
        LIMITS.FILAMENT_PRICE_PER_KILO_CUP_MAX,
      ),
      marginPercent: clampNumber(marginPercent.value, 0, LIMITS.MARGIN_PERCENT_MAX),
      dollarRateCUP: ratesStore.dollarRateCUP,
    }),
  );

  return {
    modelWeightGrams,
    filamentPricePerKiloCUP,
    marginPercent,
    result,
  };
});
