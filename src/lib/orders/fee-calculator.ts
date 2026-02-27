/**
 * Service fee configuration. Matches the serviceFee group on Events/EventTemplates.
 */
export interface ServiceFee {
  feeType: 'none' | 'percentage' | 'flat'
  feeAmount?: number | null
}

/**
 * Calculates the service fee for a ticket purchase.
 *
 * This is a pure function with zero dependencies — testable in isolation.
 * All monetary amounts are in minor units (e.g., cents for USD/CAD).
 *
 * @param baseAmount - The base ticket amount in minor units (price × quantity)
 * @param fee - The fee configuration (type + amount)
 * @returns The service fee in minor units, always a non-negative integer
 */
export function calculateServiceFee(
  baseAmount: number,
  fee?: ServiceFee | null,
): number {
  if (!fee || fee.feeType === 'none') {
    return 0
  }

  const amount = fee.feeAmount ?? 0

  if (fee.feeType === 'percentage') {
    // feeAmount is the percentage (e.g., 5 means 5%)
    return Math.floor(baseAmount * (amount / 100))
  }

  if (fee.feeType === 'flat') {
    return amount
  }

  return 0
}
