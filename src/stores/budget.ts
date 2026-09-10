import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  DEFAULT_VALUES,
  LEGACY_STORAGE_KEYS,
  LIMITS,
  SAFETY_PERCENT_OPTIONS,
  STORAGE_KEYS,
  type Currency,
  type SafetyPercent,
} from '@/utils/constants';
import {
  readRecord,
  readBoolean,
  readNumber,
  readString,
  writeRecord,
} from '@/utils/persistence';
import { calculateBudget, clampNumber } from '@/utils/calculations';
import { useMaterialsStore } from '@/stores/materials';
import { useProductionStore } from '@/stores/production';
import { useRatesStore } from '@/stores/rates';

interface PersistedPreferences {
  modelWeightGrams: number;
  selectedMaterialId: string | null;
  safetyPercent: SafetyPercent;
  requiresPainting: boolean;
  paintLaborCost: number;
  paintLaborCurrency: Currency;
}

function isSafetyPercent(value: number): value is SafetyPercent {
  return SAFETY_PERCENT_OPTIONS.some((option) => option === value);
}

function loadPreferences(): PersistedPreferences {
  const stored = readRecord([STORAGE_KEYS.PREFERENCES, LEGACY_STORAGE_KEYS.PREFERENCES]);
  const safetyPercent = readNumber(stored, ['safetyPercent'], DEFAULT_VALUES.SAFETY_PERCENT);
  const paintLaborCurrency = readString(stored, ['paintLaborCurrency']);

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
    requiresPainting: readBoolean(
      stored,
      ['requiresPainting'],
      DEFAULT_VALUES.REQUIRES_PAINTING,
    ),
    paintLaborCost: readNumber(
      stored,
      ['paintLaborCost'],
      DEFAULT_VALUES.PAINT_LABOR_COST,
    ),
    paintLaborCurrency:
      paintLaborCurrency === 'CUP' || paintLaborCurrency === 'USD'
        ? paintLaborCurrency
        : DEFAULT_VALUES.PAINT_LABOR_COST_CURRENCY,
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
  const requiresPainting = ref(preferences.requiresPainting);
  const paintLaborCost = ref(preferences.paintLaborCost);
  const paintLaborCurrency = ref<Currency>(preferences.paintLaborCurrency);

  watch(
    [
      modelWeightGrams,
      selectedMaterialId,
      safetyPercent,
      requiresPainting,
      paintLaborCost,
      paintLaborCurrency,
    ],
    () => {
      const payload: PersistedPreferences = {
        modelWeightGrams: modelWeightGrams.value,
        selectedMaterialId: selectedMaterialId.value,
        safetyPercent: safetyPercent.value,
        requiresPainting: requiresPainting.value,
        paintLaborCost: paintLaborCost.value,
        paintLaborCurrency: paintLaborCurrency.value,
      };
      writeRecord(STORAGE_KEYS.PREFERENCES, payload);
    },
  );

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

  // The piece weight and the selected filament are kept for reference and
  // display only: material cost, production cost and profit are derived
  // entirely from the production cost setting, not from these two inputs.
  const result = computed(() =>
    calculateBudget({
      productionCostPerGram: productionStore.amountPerGram,
      safetyPercent: safetyPercent.value,
      dollarRateCUP: ratesStore.dollarRateCUP,
      requiresPainting: requiresPainting.value,
      paintLaborCost: {
        value: clampNumber(paintLaborCost.value, 0, LIMITS.PAINT_LABOR_COST_MAX),
        currency: paintLaborCurrency.value,
      },
    }),
  );

  return {
    modelWeightGrams,
    selectedMaterialId,
    selectedMaterial,
    safetyPercent,
    requiresPainting,
    paintLaborCost,
    paintLaborCurrency,
    result,
  };
});
