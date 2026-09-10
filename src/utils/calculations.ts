import type { MoneyAmount } from '@/types';
import { CURRENCY, PRICING_FACTORS } from '@/utils/constants';

export interface BudgetInput {
  /**
   * The "cost per gram" value configured in Settings. The filament weight and
   * price no longer participate in the calculation directly: material cost,
   * production cost and profit are all derived from this single value. Kept
   * as a `MoneyAmount` for parity with Settings, but only `.value` is used.
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
  /** Profit derived from the production cost setting, added on top of the total. */
  profitCUP: number;
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
 * Material cost, production cost and profit are all derived from the single
 * "cost per gram" setting (`P`) and the dollar rate (`R`):
 *   - Material  = P * MATERIAL_COST_FACTOR * R
 *   - Production = (P - MATERIAL_COST_FACTOR) * R
 *   - Profit    = (P - PROFIT_OFFSET) * R
 * The piece weight and the selected filament are not part of these formulas;
 * they remain in the UI for reference only.
 */
export function calculateBudget(input: BudgetInput): BudgetResult {
  const hasRate = isPositiveDollarRate(input.dollarRateCUP);
  const productionCostValue = input.productionCostPerGram.value;

  const materialCostCUP = hasRate
    ? productionCostValue * PRICING_FACTORS.MATERIAL_COST_FACTOR * input.dollarRateCUP
    : 0;

  const productionCostCUP = hasRate
    ? (productionCostValue - PRICING_FACTORS.MATERIAL_COST_FACTOR) * input.dollarRateCUP
    : 0;

  const profitCUP = hasRate
    ? (productionCostValue - PRICING_FACTORS.PROFIT_OFFSET) * input.dollarRateCUP
    : 0;

  const subtotalCUP = materialCostCUP + productionCostCUP;

  // The safety percentage is applied to the material + production subtotal
  // only, so a 15% selection turns a 100 CUP piece into 115 CUP. Profit and
  // painting labor are added afterwards, unaffected by the failed-print margin.
  const totalWithSafetyCUP = subtotalCUP * (1 + input.safetyPercent / 100);

  // Derived by subtraction rather than recomputed, which guarantees that the
  // rows shown in the breakdown always add up to the total exactly.
  const safetyAmountCUP = totalWithSafetyCUP - subtotalCUP;

  const paintLaborCostCUP = input.requiresPainting
    ? convertToCUP(input.paintLaborCost, input.dollarRateCUP)
    : 0;

  const totalCUP = totalWithSafetyCUP + profitCUP + paintLaborCostCUP;

  const totalUSD = hasRate ? totalCUP / input.dollarRateCUP : 0;

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
