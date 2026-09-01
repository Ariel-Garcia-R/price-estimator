import { CURRENCY, type Currency } from '@/utils/constants';

export function isCurrency(value: unknown): value is Currency {
  return value === CURRENCY.CUP || value === CURRENCY.USD;
}

/** Guards against `NaN`, which a cleared numeric input produces. */
export function formatMoney(value: number, currency: Currency): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2)} ${currency}`;
}
