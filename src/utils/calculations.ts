export interface BudgetInput {
  modelWeightGrams: number;
  filamentPricePerKiloCUP: number;
  marginPercent: number;
  dollarRateCUP: number;
}

export interface BudgetResult {
  filamentCostCUP: number;
  marginAmountCUP: number;
  sellingPriceCUP: number;
  sellingPriceUSD: number;
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const filamentCostCUP = (input.modelWeightGrams / 1000) * input.filamentPricePerKiloCUP;

  // Kept as a single multiplication, identical to the original formula, so the
  // final price does not shift for anyone already using the app.
  const sellingPriceCUP = filamentCostCUP * (1 + input.marginPercent / 100);

  // Derived by subtraction rather than recomputed, which guarantees that the
  // rows shown in the breakdown always add up to the selling price exactly.
  const marginAmountCUP = sellingPriceCUP - filamentCostCUP;

  const sellingPriceUSD = isPositiveDollarRate(input.dollarRateCUP)
    ? sellingPriceCUP / input.dollarRateCUP
    : 0;

  return { filamentCostCUP, marginAmountCUP, sellingPriceCUP, sellingPriceUSD };
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
