export const APP_NAME = 'Price Estimator';

export const STORAGE_KEYS = {
  RATES: 'price_estimator_rates',
  PREFERENCES: 'price_estimator_preferences',
  MATERIALS: 'price_estimator_materials',
  PRODUCTION: 'price_estimator_production',
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

export const CURRENCY = {
  CUP: 'CUP',
  USD: 'USD',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const CURRENCY_OPTIONS: readonly Currency[] = [CURRENCY.USD, CURRENCY.CUP];

/**
 * Extra percentage charged on top of the total to absorb failed prints. Kept as
 * a fixed list because the UI is a select, not a free-form number.
 */
export const SAFETY_PERCENT_OPTIONS = [0, 5, 10, 15] as const;

export type SafetyPercent = (typeof SAFETY_PERCENT_OPTIONS)[number];

export const DEFAULT_VALUES = {
  MODEL_WEIGHT_GRAMS: 0,
  SAFETY_PERCENT: 0,
  DOLLAR_RATE_CUP: 0,
  /** Machine time, wear and energy, expressed per gram of filament. */
  PRODUCTION_COST_PER_GRAM: 0,
  PRODUCTION_COST_CURRENCY: CURRENCY.USD,
} as const;

/** Seeded on first run so the calculator is usable without visiting Settings. */
export const DEFAULT_MATERIAL = {
  name: 'PLA',
  price: 28,
  currency: CURRENCY.USD,
} as const;

export const LIMITS = {
  MODEL_WEIGHT_GRAMS_MAX: 100000,
  /** Price for one kilo of filament, in the material's own currency. */
  MATERIAL_PRICE_MAX: 100000,
  PRODUCTION_COST_PER_GRAM_MAX: 10000,
  MATERIAL_NAME_MAX_LENGTH: 40,
} as const;
