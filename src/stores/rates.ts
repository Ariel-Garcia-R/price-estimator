import { defineStore } from 'pinia';
import { ref } from 'vue';
import { STORAGE_KEYS } from '@/utils/constants';
import { parseJsonRecord, readNumber, readString } from '@/utils/persistence';
import { fetchElToqueDollarRate } from '@/services/elToque';
import { isPositiveDollarRate } from '@/utils/calculations';

export type RateSource = 'manual' | 'eltoque';

interface PersistedRates {
  dollarRateCUP: number;
  updatedAt?: string;
  source?: RateSource;
}

function isRateSource(value: string | undefined): value is RateSource {
  return value === 'manual' || value === 'eltoque';
}

function loadPersisted(): PersistedRates {
  const stored = parseJsonRecord(localStorage.getItem(STORAGE_KEYS.RATES));
  const source = readString(stored, ['source', 'fuente']);

  return {
    dollarRateCUP: readNumber(stored, ['dollarRateCUP', 'precioDolarCUP'], 0),
    updatedAt: readString(stored, ['updatedAt', 'fechaActualizacion']),
    source: isRateSource(source) ? source : undefined,
  };
}

export const useRatesStore = defineStore('rates', () => {
  const persisted = loadPersisted();

  const dollarRateCUP = ref<number>(persisted.dollarRateCUP);
  const updatedAt = ref<string | undefined>(persisted.updatedAt);
  const source = ref<RateSource | undefined>(persisted.source);
  const isLoadingRate = ref(false);
  const rateError = ref<string | null>(null);

  function persist() {
    const payload: PersistedRates = {
      dollarRateCUP: dollarRateCUP.value,
      updatedAt: updatedAt.value,
      source: source.value,
    };
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(payload));
  }

  function setManualRate(value: number) {
    dollarRateCUP.value = isPositiveDollarRate(value) ? value : 0;
    updatedAt.value = new Date().toISOString();
    source.value = 'manual';
    persist();
  }

  async function refreshFromElToque(): Promise<boolean> {
    isLoadingRate.value = true;
    rateError.value = null;
    try {
      dollarRateCUP.value = await fetchElToqueDollarRate();
      updatedAt.value = new Date().toISOString();
      source.value = 'eltoque';
      persist();
      return true;
    } catch (error) {
      rateError.value =
        error instanceof Error ? error.message : 'Failed to fetch the exchange rate';
      return false;
    } finally {
      isLoadingRate.value = false;
    }
  }

  return {
    dollarRateCUP,
    updatedAt,
    source,
    isLoadingRate,
    rateError,
    setManualRate,
    refreshFromElToque,
  };
});
