import { describe, it, expect } from 'vitest'
import { calculateServiceFee, type ServiceFee } from './fee-calculator.js'

describe('calculateServiceFee', () => {
  describe('feeType: none', () => {
    it('returns 0 regardless of base amount', () => {
      const fee: ServiceFee = { feeType: 'none' }
      expect(calculateServiceFee(10000, fee)).toBe(0)
      expect(calculateServiceFee(0, fee)).toBe(0)
      expect(calculateServiceFee(999999, fee)).toBe(0)
    })
  })

  describe('feeType: percentage', () => {
    it('calculates percentage of base amount', () => {
      const fee: ServiceFee = { feeType: 'percentage', feeAmount: 5 }
      // 5% of 10000 minor units = 500
      expect(calculateServiceFee(10000, fee)).toBe(500)
    })

    it('rounds down to nearest minor unit', () => {
      const fee: ServiceFee = { feeType: 'percentage', feeAmount: 3 }
      // 3% of 1234 = 37.02 → 37
      expect(calculateServiceFee(1234, fee)).toBe(37)
    })

    it('returns 0 when base amount is 0', () => {
      const fee: ServiceFee = { feeType: 'percentage', feeAmount: 10 }
      expect(calculateServiceFee(0, fee)).toBe(0)
    })

    it('handles fractional percentages', () => {
      const fee: ServiceFee = { feeType: 'percentage', feeAmount: 2.5 }
      // 2.5% of 10000 = 250
      expect(calculateServiceFee(10000, fee)).toBe(250)
    })

    it('treats missing feeAmount as 0', () => {
      const fee: ServiceFee = { feeType: 'percentage' }
      expect(calculateServiceFee(10000, fee)).toBe(0)
    })
  })

  describe('feeType: flat', () => {
    it('returns flat fee regardless of base amount', () => {
      const fee: ServiceFee = { feeType: 'flat', feeAmount: 200 }
      expect(calculateServiceFee(5000, fee)).toBe(200)
      expect(calculateServiceFee(100, fee)).toBe(200)
      expect(calculateServiceFee(999999, fee)).toBe(200)
    })

    it('returns 0 when feeAmount is 0', () => {
      const fee: ServiceFee = { feeType: 'flat', feeAmount: 0 }
      expect(calculateServiceFee(5000, fee)).toBe(0)
    })

    it('treats missing feeAmount as 0', () => {
      const fee: ServiceFee = { feeType: 'flat' }
      expect(calculateServiceFee(10000, fee)).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles undefined fee gracefully', () => {
      expect(calculateServiceFee(5000, undefined)).toBe(0)
    })

    it('handles null fee gracefully', () => {
      expect(calculateServiceFee(5000, null as unknown as ServiceFee)).toBe(0)
    })
  })
})
