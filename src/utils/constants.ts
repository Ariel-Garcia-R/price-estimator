export const APP_NAME = 'Price Estimator';

export const STORAGE_KEYS = {
  RATES: 'price_estimator_rates',
  PREFERENCES: 'price_estimator_preferences',
  THEME: 'price_estimator_theme',
} as const;

/**
 * Keys written before the app was renamed from "FunnelPrint 3D". They are still
 * read as a fallback so data saved by an already-deployed build is not lost.
 */
export const LEGACY_STORAGE_KEYS = {
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
