import React from 'react'

import type { Page } from '@/payload-types'

import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'
import { SetHeaderTheme } from '@/heros/SetHeaderTheme'

type FullBleedHeroProps = Page['hero']

/**
 * Full-bleed hero with background image, gradient overlay, and CTA buttons.
 *
 * Uses the `--header-height` CSS variable (set by the Header client component
 * via ResizeObserver) to pull itself up behind the header with a negative
 * margin. No magic numbers. If the header changes height — due to responsive
 * breakpoints, different nav items, whatever — the hero adapts automatically.
 *
 * The gradient overlay uses the `overlayOpacity` field (0-100) to control
 * how dark the overlay gets. Default is 50, which is readable without
 * making the background image irrelevant.
 */
export const FullBleedHero: React.FC<FullBleedHeroProps> = ({
  heading,
  subheading,
  media,
  overlayOpacity = 50,
  ctaButtons,
}) => {
  // Convert 0-100 to 0-1 for CSS opacity
  const opacity = (overlayOpacity ?? 50) / 100

  /** Map CTA variant slugs to Tailwind classes */
  const variantClasses: Record<string, string> = {
    primary:
      'bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white border-transparent',
    secondary:
      'bg-[var(--theme-secondary)] hover:bg-[var(--theme-secondary)]/90 text-white border-transparent',
    accent:
      'bg-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/90 text-white border-transparent',
    outline: 'bg-transparent hover:bg-white/10 text-white border-white/80 hover:border-white',
  }

  return (
    <div
      className="relative flex min-h-[85vh] items-center justify-center text-white"
      style={{ marginTop: 'calc(-1 * var(--header-height, 6rem))' }}
      data-theme="dark"
    >
      <SetHeaderTheme theme="dark" />

      {/* Background image */}
      <div className="absolute inset-0 -z-20 select-none">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="object-cover" priority resource={media} />
        )}
      </div>

      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/30"
        style={{ opacity }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="container relative z-10 flex flex-col items-center text-center"
        style={{ paddingTop: 'var(--header-height, 6rem)' }}
      >
        {heading && (
          <h1 className="mb-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl drop-shadow-lg">
            {heading}
          </h1>
        )}

        {subheading && (
          <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl drop-shadow-md">
            {subheading}
          </p>
        )}

        {Array.isArray(ctaButtons) && ctaButtons.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {ctaButtons.map(({ link, variant = 'primary' }, i) => (
              <CMSLink
                key={i}
                {...link}
                appearance="inline"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border-2 px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl',
                  variantClasses[variant] ?? variantClasses.primary,
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
