/**
 * Currency configuration and conversion utilities.
 *
 * Prices are stored in major units (dollars, euros, yen) throughout
 * the application — both in the database and in the admin UI. Admins
 * enter what they see: `25.00` means twenty-five dollars.
 *
 * Minor unit conversion (e.g., dollars → cents) happens ONLY at the
 * payment gateway boundary (Stripe expects amounts in minor units).
 * Use `toMinorUnits()` for that conversion.
 *
 * The `exponent` defines how many decimal places the currency uses:
 *   - 2 for USD, CAD, EUR, GBP (100 cents = 1 dollar)
 *   - 0 for JPY (no fractional unit)
 *   - 3 for KWD, BHD (1000 fils = 1 dinar)
 */

export interface CurrencyConfig {
  /** ISO 4217 currency code */
  code: string
  /** Display symbol (e.g., '$', '¥', '£') */
  symbol: string
  /** Number of decimal places (2 for USD/CAD, 0 for JPY, 3 for KWD) */
  exponent: number
  /** Human-readable name */
  name: string
}

/**
 * Supported currencies. Add new currencies here as needed.
 * The key is the ISO 4217 code.
 */
export const CURRENCIES: Record<string, CurrencyConfig> = {
  CAD: { code: 'CAD', symbol: 'CA$', exponent: 2, name: 'Canadian Dollar' },
  USD: { code: 'USD', symbol: '$', exponent: 2, name: 'US Dollar' },
} as const

/** Default currency when none is configured. */
export const DEFAULT_CURRENCY_CODE = 'CAD'

/**
 * Get the CurrencyConfig for a given code, falling back to the default.
 */
export function getCurrency(code?: string | null): CurrencyConfig {
  if (code && code in CURRENCIES) {
    return CURRENCIES[code]
  }
  return CURRENCIES[DEFAULT_CURRENCY_CODE]
}

/**
 * Convert a major-unit amount (dollars) to minor units (cents) for
 * payment gateway APIs like Stripe.
 *
 * @example toMinorUnits(25.50, getCurrency('USD')) // → 2550
 * @example toMinorUnits(1000, getCurrency('JPY'))  // → 1000 (no fractional unit)
 */
export function toMinorUnits(amount: number, currency: CurrencyConfig): number {
  return Math.round(amount * Math.pow(10, currency.exponent))
}

/**
 * Convert minor units (cents) back to major units (dollars).
 * Used when reading amounts from Stripe webhooks.
 *
 * @example fromMinorUnits(2550, getCurrency('USD')) // → 25.50
 */
export function fromMinorUnits(minorUnits: number, currency: CurrencyConfig): number {
  return minorUnits / Math.pow(10, currency.exponent)
}

/**
 * Format a major-unit amount for display using Intl.NumberFormat.
 *
 * @example formatCurrency(25.50, 'CAD') // → "CA$25.50"
 * @example formatCurrency(1000, 'JPY')  // → "¥1,000"
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)
}
