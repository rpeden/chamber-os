'use client'

import { useField, TextInput, FieldLabel, useFormFields } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import React, { useCallback, useMemo } from 'react'

/**
 * Custom admin field component for currency amounts.
 *
 * Stores values in minor units (e.g., cents) in the database,
 * but displays and accepts input in major units (e.g., dollars).
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

  // Convert stored minor units to major units for display
  const displayValue = useMemo(() => {
    if (value === null || value === undefined || value === 0) return ''
    return (value / divisor).toFixed(exponent)
  }, [value, divisor, exponent])

  // Convert major units input to minor units for storage
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      if (inputVal === '' || inputVal === null) {
        setValue(0)
        return
      }
      const parsed = parseFloat(inputVal)
      if (Number.isNaN(parsed)) return
      setValue(Math.round(parsed * divisor))
    },
    [divisor, setValue],
  )

  const step = exponent > 0 ? (1 / divisor).toFixed(exponent) : '1'

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
          type="number"
          id={`field-${path}`}
          name={path}
          value={displayValue}
          onChange={handleChange}
          min={field.min !== undefined ? field.min / divisor : undefined}
          step={step}
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
