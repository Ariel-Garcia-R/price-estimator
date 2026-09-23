import type { MoneyAmount } from '@/types';
import { CURRENCY, PRICING_FACTORS } from '@/utils/constants';

export interface BudgetInput {
  /** Weight of the piece; every per-gram amount is multiplied by it. */
  modelWeightGrams: number;
  /**
   * The "cost per gram" configured in Settings: the full selling price per
   * gram (material + production + profit), before safety margin and painting.
   */
  productionCostPerGram: MoneyAmount;
  safetyPercent: number;
  dollarRateCUP: number;
  /** Whether painting labor cost should be added to the final price. */
  requiresPainting: boolean;
  /** Painting labor cost, only added to the total when `requiresPainting` is true. */
  paintLaborCost: MoneyAmount;
}

export interface BudgetResult {
  materialCostCUP: number;
  productionCostCUP: number;
  profitCUP: number;
  /** Material + production + profit, the base the safety margin applies to. */
  subtotalCUP: number;
  safetyAmountCUP: number;
  paintLaborCostCUP: number;
  totalCUP: number;
  totalUSD: number;
  /**
   * True when an amount contributes to the total but no exchange rate is
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

/**
 * With `P` = cost per gram (Settings), `R` = dollar rate and `g` = grams:
 *   - Material   = 0.04 USD * R * g
 *   - Production = 0.04 USD * R * g
 *   - Profit     = (P - 0.08 USD) * R * g   (never below 0)
 *   - Subtotal   = Material + Production + Profit
 *   - Total      = Subtotal * (1 + safety%) + painting
 *
 * Example, 1 g, P = 0.12 USD, R = 720, 10% safety, 1000 CUP painting:
 *   (28.8 + 28.8 + 28.8) * 1.1 + 1000 = 1095.04 CUP
 */
export function calculateBudget(input: BudgetInput): BudgetResult {
  const hasRate = isPositiveDollarRate(input.dollarRateCUP);
  const rate = hasRate ? input.dollarRateCUP : 0;
  const grams = clampNumber(input.modelWeightGrams, 0, Number.MAX_SAFE_INTEGER);

  const costPerGramCUP = Math.max(convertToCUP(input.productionCostPerGram, rate), 0);
  const materialPerGramCUP = PRICING_FACTORS.MATERIAL_COST_PER_GRAM_USD * rate;
  const productionPerGramCUP = PRICING_FACTORS.PRODUCTION_COST_PER_GRAM_USD * rate;

  // A cost per gram below material + production would mean selling at a loss;
  // the profit is floored at 0 instead of showing a negative amount.
  const profitPerGramCUP = Math.max(
    costPerGramCUP - materialPerGramCUP - productionPerGramCUP,
    0,
  );

  const materialCostCUP = materialPerGramCUP * grams;
  const productionCostCUP = productionPerGramCUP * grams;
  const profitCUP = profitPerGramCUP * grams;
  const subtotalCUP = materialCostCUP + productionCostCUP + profitCUP;

  // The safety margin applies to material + production + profit only;
  // painting is added afterwards, unaffected by it.
  const safetyAmountCUP = subtotalCUP * (Math.max(input.safetyPercent, 0) / 100);

  const paintLaborCostCUP = input.requiresPainting
    ? Math.max(convertToCUP(input.paintLaborCost, rate), 0)
    : 0;

  const totalCUP = subtotalCUP + safetyAmountCUP + paintLaborCostCUP;
  const totalUSD = hasRate ? totalCUP / rate : 0;

  return {
    materialCostCUP,
    productionCostCUP,
    profitCUP,
    subtotalCUP,
    safetyAmountCUP,
    paintLaborCostCUP,
    totalCUP,
    totalUSD,
    // Every component above depends on the dollar rate, so a missing rate
    // always makes the result incomplete.
    requiresDollarRate: !hasRate,
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
