import type { MoneyAmount } from '@/types';
import { CURRENCY } from '@/utils/constants';

export interface BudgetInput {
  modelWeightGrams: number;
  /** Price of one kilo of the selected filament. `null` when none is selected. */
  materialPricePerKilo: MoneyAmount | null;
  /** Machine time, wear and energy, per gram of filament. */
  productionCostPerGram: MoneyAmount;
  safetyPercent: number;
  dollarRateCUP: number;
}

export interface BudgetResult {
  materialCostCUP: number;
  productionCostCUP: number;
  subtotalCUP: number;
  safetyAmountCUP: number;
  totalCUP: number;
  totalUSD: number;
  /**
   * True when a USD amount contributes to the total but no exchange rate is
   * available, so the total shown is incomplete rather than merely zero.
   */
  requiresDollarRate: boolean;
}

/**
 * Converts an amount to CUP. USD amounts need the exchange rate; without it the
 * contribution is reported as 0 and `requiresDollarRate` flags the shortfall.
 */
export function convertToCUP(amount: MoneyAmount, dollarRateCUP: number): number {
  if (!Number.isFinite(amount.value)) return 0;
  if (amount.currency === CURRENCY.CUP) return amount.value;
  return isPositiveDollarRate(dollarRateCUP) ? amount.value * dollarRateCUP : 0;
}

function needsMissingRate(amount: MoneyAmount, dollarRateCUP: number): boolean {
  return (
    amount.currency === CURRENCY.USD &&
    amount.value > 0 &&
    !isPositiveDollarRate(dollarRateCUP)
  );
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const kilos = input.modelWeightGrams / 1000;

  const materialAmount: MoneyAmount = input.materialPricePerKilo
    ? {
        value: input.materialPricePerKilo.value * kilos,
        currency: input.materialPricePerKilo.currency,
      }
    : { value: 0, currency: CURRENCY.CUP };

  const productionAmount: MoneyAmount = {
    value: input.productionCostPerGram.value * input.modelWeightGrams,
    currency: input.productionCostPerGram.currency,
  };

  const materialCostCUP = convertToCUP(materialAmount, input.dollarRateCUP);
  const productionCostCUP = convertToCUP(productionAmount, input.dollarRateCUP);

  const subtotalCUP = materialCostCUP + productionCostCUP;

  // The safety percentage is applied to the whole subtotal, so a 15% selection
  // turns a 100 CUP piece into 115 CUP.
  const totalCUP = subtotalCUP * (1 + input.safetyPercent / 100);

  // Derived by subtraction rather than recomputed, which guarantees that the
  // rows shown in the breakdown always add up to the total exactly.
  const safetyAmountCUP = totalCUP - subtotalCUP;

  const totalUSD = isPositiveDollarRate(input.dollarRateCUP)
    ? totalCUP / input.dollarRateCUP
    : 0;

  return {
    materialCostCUP,
    productionCostCUP,
    subtotalCUP,
    safetyAmountCUP,
    totalCUP,
    totalUSD,
    requiresDollarRate:
      needsMissingRate(materialAmount, input.dollarRateCUP) ||
      needsMissingRate(productionAmount, input.dollarRateCUP),
  };
}

export function isPositiveDollarRate(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
