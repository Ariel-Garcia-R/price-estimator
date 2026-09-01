import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  DEFAULT_VALUES,
  LEGACY_STORAGE_KEYS,
  LIMITS,
  SAFETY_PERCENT_OPTIONS,
  STORAGE_KEYS,
  type SafetyPercent,
} from '@/utils/constants';
import { readRecord, readNumber, readString, writeRecord } from '@/utils/persistence';
import { calculateBudget, clampNumber } from '@/utils/calculations';
import { useMaterialsStore } from '@/stores/materials';
import { useProductionStore } from '@/stores/production';
import { useRatesStore } from '@/stores/rates';

interface PersistedPreferences {
  modelWeightGrams: number;
  selectedMaterialId: string | null;
  safetyPercent: SafetyPercent;
}

function isSafetyPercent(value: number): value is SafetyPercent {
  return SAFETY_PERCENT_OPTIONS.some((option) => option === value);
}

function loadPreferences(): PersistedPreferences {
  const stored = readRecord([STORAGE_KEYS.PREFERENCES, LEGACY_STORAGE_KEYS.PREFERENCES]);
  const safetyPercent = readNumber(stored, ['safetyPercent'], DEFAULT_VALUES.SAFETY_PERCENT);

  return {
    modelWeightGrams: readNumber(
      stored,
      ['modelWeightGrams', 'pesoModeloGramos'],
      DEFAULT_VALUES.MODEL_WEIGHT_GRAMS,
    ),
    selectedMaterialId: readString(stored, ['selectedMaterialId']) ?? null,
    safetyPercent: isSafetyPercent(safetyPercent)
      ? safetyPercent
      : DEFAULT_VALUES.SAFETY_PERCENT,
  };
}

export const useBudgetStore = defineStore('budget', () => {
  const preferences = loadPreferences();

  const materialsStore = useMaterialsStore();
  const productionStore = useProductionStore();
  const ratesStore = useRatesStore();

  const modelWeightGrams = ref(preferences.modelWeightGrams);
  const selectedMaterialId = ref<string | null>(preferences.selectedMaterialId);
  const safetyPercent = ref<SafetyPercent>(preferences.safetyPercent);

  watch([modelWeightGrams, selectedMaterialId, safetyPercent], () => {
    const payload: PersistedPreferences = {
      modelWeightGrams: modelWeightGrams.value,
      selectedMaterialId: selectedMaterialId.value,
      safetyPercent: safetyPercent.value,
    };
    writeRecord(STORAGE_KEYS.PREFERENCES, payload);
  });

  const selectedMaterial = computed(() => materialsStore.findById(selectedMaterialId.value));

  /**
   * Keeps the selection pointing at an existing material: on first run there is
   * no stored id, and a material can be deleted from Settings while selected.
   */
  watch(
    () => [selectedMaterial.value, materialsStore.materials[0]] as const,
    ([current, first]) => {
      if (current) return;
      selectedMaterialId.value = first ? first.id : null;
    },
    { immediate: true },
  );

  const result = computed(() =>
    calculateBudget({
      modelWeightGrams: clampNumber(modelWeightGrams.value, 0, LIMITS.MODEL_WEIGHT_GRAMS_MAX),
      materialPricePerKilo: selectedMaterial.value
        ? {
            value: selectedMaterial.value.price,
            currency: selectedMaterial.value.currency,
          }
        : null,
      productionCostPerGram: productionStore.amountPerGram,
      safetyPercent: safetyPercent.value,
      dollarRateCUP: ratesStore.dollarRateCUP,
    }),
  );

  return {
    modelWeightGrams,
    selectedMaterialId,
    selectedMaterial,
    safetyPercent,
    result,
  };
});
