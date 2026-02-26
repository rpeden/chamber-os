import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME, generateThemeCSS, hexToCSS } from '@/lib/theme'

describe('lib/theme', () => {
  it('generateThemeCSS outputs all required CSS custom properties', () => {
    const css = generateThemeCSS({
      primaryColor: '#123456',
      secondaryColor: '#654321',
      accentColor: '#abcdef',
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Lora', serif",
    })

    expect(css).toContain('--theme-primary: #123456;')
    expect(css).toContain('--theme-secondary: #654321;')
    expect(css).toContain('--theme-accent: #abcdef;')
    expect(css).toContain("--theme-heading-font: 'Inter', sans-serif;")
    expect(css).toContain("--theme-body-font: 'Lora', serif;")
    expect(css).toContain(':root {')
  })

  it('hexToCSS currently passes through hex input unchanged', () => {
    expect(hexToCSS('#1e3a5f')).toBe('#1e3a5f')
  })

  it('DEFAULT_THEME includes required keys', () => {
    expect(DEFAULT_THEME).toMatchObject({
      primaryColor: expect.any(String),
      secondaryColor: expect.any(String),
      accentColor: expect.any(String),
      headingFont: expect.any(String),
      bodyFont: expect.any(String),
    })
  })
})
