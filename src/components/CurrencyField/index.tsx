'use client'

import { useField, FieldLabel } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import React, { useState, useEffect, useCallback } from 'react'

/**
 * Custom admin field component for currency amounts.
 *
 * Stores values in minor units (e.g., cents) in the database,
 * but displays and accepts input in major units (e.g., dollars).
 *
 * Uses a local string state so the user can freely type multi-digit
 * values (e.g., "10", "20.50") without the field committing on every
 * keystroke and mangling the cursor position. The stored value is only
 * updated on blur or when the input loses focus.
 *
 * The exponent (number of decimal places) is read from the field's
 * custom config (`field.custom.currencyExponent`), defaulting to 2.
 *
 * The currency symbol is read from `field.custom.currencySymbol`,
 * defaulting to '$'.
 */
export const CurrencyField: NumberFieldClientComponent = (props) => {
  const { field, path } = props

  const customProps = (field as Record<string, unknown>).custom as Record<string, unknown> | undefined
  const exponent = (customProps?.currencyExponent as number) ?? 2
  const currencySymbol = (customProps?.currencySymbol as string) ?? '$'
  const divisor = Math.pow(10, exponent)

  const { value, setValue } = useField<number>({ path })

  // Local string state — what the user sees while typing
  const [inputStr, setInputStr] = useState<string>(() => {
    if (value === null || value === undefined || value === 0) return ''
    return (value / divisor).toString()
  })
  const [focused, setFocused] = useState(false)

  // Sync display when the stored value changes externally (e.g. template fills)
  // but only when the user isn't actively editing
  useEffect(() => {
    if (!focused) {
      if (value === null || value === undefined || value === 0) {
        setInputStr('')
      } else {
        setInputStr((value / divisor).toString())
      }
    }
  }, [value, divisor, focused])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Accept any input — validate on blur
    setInputStr(e.target.value)
  }, [])

  const handleFocus = useCallback(() => setFocused(true), [])

  const handleBlur = useCallback(() => {
    setFocused(false)
    const cleaned = inputStr.trim()
    if (cleaned === '' || cleaned === '.') {
      setValue(0)
      setInputStr('')
      return
    }
    const parsed = parseFloat(cleaned)
    if (Number.isNaN(parsed) || parsed < 0) {
      // Revert to the last stored value
      setInputStr(value ? (value / divisor).toString() : '')
      return
    }
    const minorUnits = Math.round(parsed * divisor)
    setValue(minorUnits)
    setInputStr((minorUnits / divisor).toString())
  }, [inputStr, value, divisor, setValue])

  return (
    <div className="field-type number">
      <FieldLabel label={field.label || field.name} path={path} required={field.required} />
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--theme-elevation-500)',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {currencySymbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          id={`field-${path}`}
          name={path}
          value={inputStr}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={`0.${'0'.repeat(exponent)}`}
          style={{ paddingLeft: '28px', width: '100%' }}
          className="field-type__input"
        />
      </div>
      {field.admin?.description && (
        <div className="field-description">{field.admin.description as string}</div>
      )}
    </div>
  )
}

export default CurrencyField
