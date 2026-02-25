import React from 'react'
import { cn } from '@/utilities/ui'

/**
 * Background variant options available on all blocks.
 * Maps to CSS classes that use the theme custom properties.
 */
export type BackgroundVariant = 'default' | 'light' | 'dark' | 'brand' | 'accent'

const backgroundClasses: Record<BackgroundVariant, string> = {
  default: 'bg-background text-foreground',
  light: 'bg-muted text-foreground',
  dark: 'bg-gray-900 text-white',
  brand: 'bg-theme-primary text-white',
  accent: 'bg-theme-accent text-gray-900',
}

interface BlockWrapperProps {
  /** Background color variant */
  background?: BackgroundVariant | null
  /** Additional CSS classes */
  className?: string
  /** Rendered block content */
  children: React.ReactNode
  /** Whether to constrain content width with a container */
  container?: boolean
  /** Section padding — 'default' gives standard vertical spacing, 'none' removes it */
  padding?: 'default' | 'tight' | 'loose' | 'none'
  /** HTML id for anchor linking */
  id?: string
}

const paddingClasses: Record<NonNullable<BlockWrapperProps['padding']>, string> = {
  default: 'py-16 md:py-20',
  tight: 'py-8 md:py-12',
  loose: 'py-24 md:py-32',
  none: '',
}

/**
 * Shared section wrapper for all page blocks.
 *
 * Provides:
 * - Consistent vertical spacing between sections
 * - Background color variants (default, light, dark, brand, accent)
 * - Optional max-width container for content
 * - Anchor link support via id prop
 *
 * Every block component should wrap its output in this component.
 */
export function BlockWrapper({
  background = 'default',
  className,
  children,
  container = true,
  padding = 'default',
  id,
}: BlockWrapperProps) {
  return (
    <section
      id={id ?? undefined}
      className={cn(backgroundClasses[background ?? 'default'], paddingClasses[padding], className)}
    >
      {container ? <div className="container">{children}</div> : children}
    </section>
  )
}
