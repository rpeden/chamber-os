'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect } from 'react'
import type { Theme } from '@/providers/Theme/types'

/**
 * Tiny client component that sets the header theme on mount.
 *
 * This exists so we can keep the hero itself as a Server Component
 * while still telling the header to switch to dark mode (or whatever).
 * The old HighImpactHero was a client component *solely* for this
 * one side effect. That's like renting a U-Haul to carry a banana.
 */
export const SetHeaderTheme: React.FC<{ theme: Theme }> = ({ theme }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme(theme)
  }, [theme, setHeaderTheme])

  return null
}
