export interface BudgetInput {
  modelWeightGrams: number;
  filamentPricePerKiloCUP: number;
  marginPercent: number;
  dollarRateCUP: number;
}

export interface BudgetResult {
  filamentCostCUP: number;
  baseCostCUP: number;
  sellingPriceCUP: number;
  sellingPriceUSD: number;
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const filamentCostCUP = (input.modelWeightGrams / 1000) * input.filamentPricePerKiloCUP;
  const baseCostCUP = filamentCostCUP * (1 + input.marginPercent / 100);
  const sellingPriceCUP = baseCostCUP;
  const sellingPriceUSD = isPositiveDollarRate(input.dollarRateCUP)
    ? baseCostCUP / input.dollarRateCUP
    : 0;

  return { filamentCostCUP, baseCostCUP, sellingPriceCUP, sellingPriceUSD };
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
