import { describe, expect, it } from 'vitest'

import { hero } from '@/heros/config'

type HeroField = {
  name: string
  type: string
  required?: boolean
  min?: number
  max?: number
  defaultValue?: unknown
  maxRows?: number
  options?: Array<{ label: string; value: string }>
  admin?: {
    condition?: (...args: any[]) => boolean
  }
}

function getField(fieldName: string): HeroField {
  const fields = (hero as { fields: HeroField[] }).fields
  const field = fields.find((f) => f.name === fieldName)

  if (!field) {
    throw new Error(`Expected hero field "${fieldName}" to exist`)
  }

  return field
}

describe('heros/config', () => {
  it('defines hero as a group field with required top-level fields', () => {
    const heroGroup = hero as HeroField & { fields: HeroField[] }

    expect(heroGroup.name).toBe('hero')
    expect(heroGroup.type).toBe('group')

    const topLevelFields = heroGroup.fields.map((f) => f.name)
    expect(topLevelFields).toEqual(
      expect.arrayContaining([
        'type',
        'heading',
        'subheading',
        'media',
        'overlayOpacity',
        'ctaButtons',
      ]),
    )
  })

  it('supports expected hero type options', () => {
    const typeField = getField('type')
    const typeValues = (typeField.options ?? []).map((option) => option.value)

    expect(typeValues).toEqual(expect.arrayContaining(['none', 'minimal', 'fullBleed']))
  })

  it('enforces CTA button maxRows of 3', () => {
    const ctaButtonsField = getField('ctaButtons')
    expect(ctaButtonsField.maxRows).toBe(3)
  })

  it('enforces overlay opacity bounds and default', () => {
    const overlayOpacityField = getField('overlayOpacity')
    expect(overlayOpacityField.type).toBe('number')
    expect(overlayOpacityField.min).toBe(0)
    expect(overlayOpacityField.max).toBe(100)
    expect(overlayOpacityField.defaultValue).toBe(50)
  })

  it('keeps conditional requirements for heading and media', () => {
    const headingField = getField('heading')
    const mediaField = getField('media')

    expect(headingField.required).toBe(true)
    expect(headingField.admin?.condition?.({}, { type: 'none' })).toBe(false)
    expect(headingField.admin?.condition?.({}, { type: 'minimal' })).toBe(true)

    expect(mediaField.required).toBe(true)
    expect(mediaField.admin?.condition?.({}, { type: 'minimal' })).toBe(false)
    expect(mediaField.admin?.condition?.({}, { type: 'fullBleed' })).toBe(true)
  })
})
