import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { BlockWrapper } from '@/components/BlockWrapper'
import { getMediaUrl } from '@/utilities/getMediaUrl'

import type { CtaBannerBlock as CtaBannerBlockProps } from '@/payload-types'

/**
 * CTA button color classes keyed by variant.
 * These map to theme CSS custom properties for brand consistency.
 */
const ctaClasses: Record<string, string> = {
  primary:
    'bg-[var(--theme-primary,theme(colors.blue.600))] hover:bg-[var(--theme-primary,theme(colors.blue.700))]/90 text-white',
  secondary:
    'bg-[var(--theme-secondary,theme(colors.gray.700))] hover:bg-[var(--theme-secondary,theme(colors.gray.800))]/90 text-white',
  accent:
    'bg-[var(--theme-accent,theme(colors.amber.500))] hover:bg-[var(--theme-accent,theme(colors.amber.600))]/90 text-gray-900',
  outline: 'bg-transparent border-2 border-current hover:bg-white/10',
}

export const CtaBannerBlock: React.FC<CtaBannerBlockProps> = ({
  heading,
  body,
  link,
  ctaVariant,
  backgroundImage,
  background,
}) => {
  const hasBackgroundImage = backgroundImage && typeof backgroundImage === 'object'
  const imageUrl = hasBackgroundImage ? getMediaUrl(backgroundImage.url) : null

  return (
    <BlockWrapper
      background={hasBackgroundImage ? 'dark' : background}
      container={false}
      padding="none"
    >
      <div
        className={cn('relative py-16 md:py-24', hasBackgroundImage && 'bg-cover bg-center')}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        {/* Dark overlay for background image readability */}
        {hasBackgroundImage && <div className="absolute inset-0 bg-black/60" aria-hidden="true" />}

        <div
          className={cn(
            'container relative z-10 text-center max-w-3xl mx-auto',
            hasBackgroundImage && 'text-white',
          )}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{heading}</h2>
          {body && (
            <div className="mb-8 text-lg opacity-90">
              <RichText data={body} enableGutter={false} />
            </div>
          )}
          {link && (
            <CMSLink
              {...link}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-8 py-3 text-lg font-semibold transition-colors',
                ctaClasses[ctaVariant ?? 'primary'],
              )}
              appearance="inline"
            />
          )}
        </div>
      </div>
    </BlockWrapper>
  )
}
