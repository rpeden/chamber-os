import { describe, it, expect } from 'vitest'
import {
  getCurrency,
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  CURRENCIES,
} from './currency'

describe('getCurrency', () => {
  it('returns the correct config for a known code', () => {
    expect(getCurrency('USD')).toEqual(CURRENCIES.USD)
    expect(getCurrency('CAD')).toEqual(CURRENCIES.CAD)
  })

  it('falls back to CAD for unknown codes', () => {
    expect(getCurrency('ZZZ')).toEqual(CURRENCIES.CAD)
  })

  it('falls back to CAD for null/undefined', () => {
    expect(getCurrency(null)).toEqual(CURRENCIES.CAD)
    expect(getCurrency(undefined)).toEqual(CURRENCIES.CAD)
  })
})

describe('toMinorUnits', () => {
  it('converts dollars to cents for USD (exponent 2)', () => {
    expect(toMinorUnits(25.50, CURRENCIES.USD)).toBe(2550)
  })

  it('converts dollars to cents for CAD (exponent 2)', () => {
    expect(toMinorUnits(100, CURRENCIES.CAD)).toBe(10000)
  })

  it('handles zero', () => {
    expect(toMinorUnits(0, CURRENCIES.USD)).toBe(0)
  })

  it('rounds to nearest minor unit to avoid floating-point drift', () => {
    // 19.99 * 100 = 1998.9999999999998 in IEEE 754
    expect(toMinorUnits(19.99, CURRENCIES.USD)).toBe(1999)
  })
})

describe('fromMinorUnits', () => {
  it('converts cents to dollars', () => {
    expect(fromMinorUnits(2550, CURRENCIES.USD)).toBe(25.50)
  })

  it('handles zero', () => {
    expect(fromMinorUnits(0, CURRENCIES.CAD)).toBe(0)
  })

  it('handles whole dollar amounts', () => {
    expect(fromMinorUnits(10000, CURRENCIES.CAD)).toBe(100)
  })
})

describe('formatCurrency', () => {
  it('formats USD amounts', () => {
    const formatted = formatCurrency(25.50, 'USD')
    expect(formatted).toContain('25.50')
  })

  it('formats CAD amounts', () => {
    const formatted = formatCurrency(100, 'CAD')
    expect(formatted).toContain('100.00')
  })

  it('formats zero', () => {
    const formatted = formatCurrency(0, 'USD')
    expect(formatted).toContain('0.00')
  })
})
