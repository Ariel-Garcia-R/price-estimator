import type { Currency } from '@/utils/constants';

/** A monetary value together with the currency it is expressed in. */
export interface MoneyAmount {
  value: number;
  currency: Currency;
}

/** A filament the user can pick in the calculator. */
export interface Material {
  id: string;
  name: string;
  /** Price of one kilo of this filament, expressed in `currency`. */
  price: number;
  currency: Currency;
}

/** Material fields the user edits; the id is assigned by the store. */
export type MaterialDraft = Omit<Material, 'id'>;
