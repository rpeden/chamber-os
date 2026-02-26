import React from 'react'
import { ArrowRight } from 'lucide-react'

import type { Page } from '@/payload-types'

import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

type FullBleedHeroProps = Page['hero']

/**
 * Contained hero with background image, dark overlay, and OBOT-style
 * floating CTA cards near the bottom.
 *
 * Inspired by the Ottawa Board of Trade: the hero sits inside the page
 * with horizontal margins (like OBOT) but NO rounded corners — just
 * straight edges meeting the page gutters. CTA buttons are semi-transparent
 * colored cards that float near the bottom of the hero with text
 * left-aligned and an arrow icon on the right.
 *
 * The `overlayOpacity` field (0-100) controls how dark the overlay gets.
 * Higher values = more readable white text on busy images. Default 60.
 */
export const FullBleedHero: React.FC<FullBleedHeroProps> = ({
  heading,
  subheading,
  media,
  overlayOpacity = 60,
  ctaButtons,
}) => {
  // Convert 0-100 to 0-1 for CSS opacity
  const opacity = (overlayOpacity ?? 60) / 100

  /** Map CTA variant slugs to semi-transparent background colors */
  const variantClasses: Record<string, string> = {
    primary: 'bg-[var(--theme-primary)]/85 hover:bg-[var(--theme-primary)]/95',
    secondary: 'bg-[var(--theme-secondary)]/85 hover:bg-[var(--theme-secondary)]/95',
    accent: 'bg-[var(--theme-accent)]/85 hover:bg-[var(--theme-accent)]/95',
    outline: 'bg-white/20 hover:bg-white/30',
  }

  const buttonCount = Array.isArray(ctaButtons) ? ctaButtons.length : 0

  return (
    <section className="px-3 pt-2 pb-2 sm:px-4 sm:pt-3 sm:pb-3 md:px-6 md:pt-4 md:pb-4 lg:px-8 lg:pt-5 lg:pb-5">
      <div
        className="relative flex min-h-[75vh] flex-col overflow-hidden text-white"
        data-theme="dark"
      >
        {/* Background image */}
        <div className="absolute inset-0 -z-20 select-none">
          {media && typeof media === 'object' && (
            <Media fill imgClassName="object-cover" priority resource={media} />
          )}
        </div>

        {/* Dark overlay — opacity controlled by the overlayOpacity field */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/30"
          style={{ opacity }}
          aria-hidden="true"
        />

        {/* Content — flex-1 pushes CTAs toward bottom */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center md:py-20">
          {heading && (
            <h1
              className="mb-4 max-w-4xl leading-tight tracking-tight drop-shadow-lg"
              style={{ fontSize: '60px', fontWeight: 500 }}
            >
              {heading}
            </h1>
          )}

          {subheading && (
            <p
              className="max-w-2xl text-white/90 drop-shadow-md"
              style={{ fontSize: '30px', fontWeight: 400 }}
            >
              {subheading}
            </p>
          )}
        </div>

        {/* CTA Cards — OBOT-style floating, semi-transparent, near bottom */}
        {buttonCount > 0 && (
          <div className="relative z-10 px-4 pb-8 sm:px-8 md:px-12 lg:px-16">
            <div
              className={cn(
                'grid grid-cols-1 gap-3 sm:gap-4',
                buttonCount === 2 && 'sm:grid-cols-2 max-w-3xl',
                buttonCount >= 3 && 'sm:grid-cols-3 max-w-5xl',
              )}
            >
              {ctaButtons!.map(({ link, variant = 'primary' }, i) => (
                <CMSLink
                  key={i}
                  {...link}
                  appearance="inline"
                  className={cn(
                    'group flex items-center justify-between px-6 py-5 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200',
                    variantClasses[variant] ?? variantClasses.primary,
                  )}
                >
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </CMSLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
