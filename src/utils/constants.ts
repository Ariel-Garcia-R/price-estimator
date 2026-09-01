export const STORAGE_KEYS = {
  RATES: 'funnelprint_rates',
  PREFERENCES: 'funnelprint_preferences',
} as const;

export const DEFAULT_VALUES = {
  MARGIN_PERCENT: 30,
  MODEL_WEIGHT_GRAMS: 0,
  FILAMENT_PRICE_PER_KILO_CUP: 0,
  DOLLAR_RATE_CUP: 0,
} as const;

export const LIMITS = {
  MODEL_WEIGHT_GRAMS_MAX: 100000,
  FILAMENT_PRICE_PER_KILO_CUP_MAX: 100000,
  MARGIN_PERCENT_MAX: 1000,
} as const;

export const CURRENCY = {
  CUP: 'CUP',
  USD: 'USD',
} as const;
