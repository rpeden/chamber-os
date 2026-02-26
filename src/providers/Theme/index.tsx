'use client'

import React, { createContext, useCallback, use, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

/**
 * Theme provider — currently locked to 'light' mode.
 *
 * The full theme-switching machinery lived here before, but it was
 * fighting the server-side `data-theme="light"` we set on `<html>`.
 * On Macs with dark mode, `getImplicitPreference()` would return 'dark'
 * on hydration and slam `data-theme="dark"` back on, making nav links
 * and hover states invisible (white on white / dark on dark).
 *
 * When we're ready for multi-theme support, restore the useEffect that
 * reads from localStorage and checks OS preference. For now, light mode
 * is the law.
 */

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: 'light',
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme] = useState<Theme>('light')

  // No-op for now — locked to light mode
  const setTheme = useCallback((_themeToSet: Theme | null) => {
    // Intentionally disabled. When multi-theme support ships,
    // this will write to localStorage and update data-theme.
  }, [])

  return <ThemeContext value={{ setTheme, theme }}>{children}</ThemeContext>
}

export const useTheme = (): ThemeContextType => use(ThemeContext)
