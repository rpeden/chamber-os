/**
 * Theme utilities for Chamber OS.
 *
 * The theming system works by injecting CSS custom properties from the
 * `site-settings` global into the <head>. This module provides the
 * types, defaults, and helpers for that system.
 */

/** Curated font options available in the admin theme picker */
export const FONT_OPTIONS = [
  { label: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Geist Sans', value: 'var(--font-geist-sans), sans-serif' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Raleway', value: "'Raleway', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
] as const

/** Default theme values — used when site-settings hasn't been configured yet */
export const DEFAULT_THEME = {
  primaryColor: '#1e3a5f',
  secondaryColor: '#2d5f8a',
  accentColor: '#e8a317',
  headingFont: 'system-ui, -apple-system, sans-serif',
  bodyFont: 'system-ui, -apple-system, sans-serif',
} as const

export type ThemeSettings = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
}

/**
 * Converts a hex color string to an oklch-compatible CSS value.
 * For now, we pass hex through directly — CSS can handle it.
 * In a future iteration we could convert to oklch for better perceptual uniformity.
 */
export function hexToCSS(hex: string): string {
  return hex
}

/**
 * Generates the CSS custom property declarations for a theme.
 * These get injected into a <style> tag in the document <head>.
 */
export function generateThemeCSS(theme: ThemeSettings): string {
  return `
    :root {
      --theme-primary: ${hexToCSS(theme.primaryColor)};
      --theme-secondary: ${hexToCSS(theme.secondaryColor)};
      --theme-accent: ${hexToCSS(theme.accentColor)};
      --theme-heading-font: ${theme.headingFont};
      --theme-body-font: ${theme.bodyFont};
    }
  `.trim()
}
