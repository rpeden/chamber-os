import type { NumberField } from 'payload'
import { DEFAULT_CURRENCY_CODE, getCurrency } from '@/lib/currency'

/**
 * Options for the currencyField factory.
 */
interface CurrencyFieldOptions {
  /** Payload field name (e.g., 'price', 'annualPrice') */
  name: string
  /** Whether the field is required */
  required?: boolean
  /** Admin description text */
  description?: string
  /** Minimum value in minor units (default: 0) */
  min?: number
  /** ISO 4217 currency code — defaults to site default */
  currencyCode?: string
  /** Additional admin overrides */
  admin?: Partial<NumberField['admin']>
}

/**
 * Creates a Payload number field that stores money in minor units
 * (e.g., cents) but displays and accepts input in major units
 * (e.g., dollars) in the admin UI via a custom field component.
 *
 * Usage:
 * ```ts
 * fields: [
 *   currencyField({ name: 'price', required: true, description: 'Ticket price' }),
 * ]
 * ```
 */
export function currencyField(options: CurrencyFieldOptions): NumberField {
  const currency = getCurrency(options.currencyCode ?? DEFAULT_CURRENCY_CODE)

  return {
    name: options.name,
    type: 'number',
    required: options.required,
    min: options.min ?? 0,
    custom: {
      currencyExponent: currency.exponent,
      currencySymbol: currency.symbol,
    },
    admin: {
      description: options.description,
      components: {
        Field: '@/components/CurrencyField',
      },
      ...options.admin,
    },
  }
}
