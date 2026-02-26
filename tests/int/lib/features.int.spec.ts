import { describe, expect, it } from 'vitest'

import { features, type FeatureFlag } from '@/lib/features'

describe('lib/features', () => {
  it('exports the expected feature keys', () => {
    const expectedKeys: FeatureFlag[] = [
      'events',
      'news',
      'memberPortal',
      'ticketing',
      'sponsors',
      'team',
      'analytics',
      'forums',
      'voting',
    ]

    const actualKeys = Object.keys(features).sort()
    expect(actualKeys).toEqual([...expectedKeys].sort())
  })

  it('stores all feature values as booleans', () => {
    for (const value of Object.values(features)) {
      expect(typeof value).toBe('boolean')
    }
  })
})
