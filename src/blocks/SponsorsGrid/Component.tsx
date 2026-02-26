import React from 'react'
import { BlockWrapper } from '@/components/BlockWrapper'
import { LogoCarousel, LogoGrid } from './LogoDisplay'

import type { SponsorsGridBlock as SponsorsGridBlockProps } from '@/payload-types'

/**
 * Sponsors Grid block — server component wrapper that renders tier headings
 * and delegates logo display to the appropriate client component
 * (grid or carousel) based on the tier's display mode.
 */
export const SponsorsGridBlock: React.FC<SponsorsGridBlockProps> = ({
  sectionHeading,
  tiers,
  background,
}) => {
  if (!tiers || tiers.length === 0) return null

  return (
    <BlockWrapper background={background}>
      {sectionHeading && (
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">{sectionHeading}</h2>
      )}

      <div className="space-y-12">
        {tiers.map((tier, index) => {
          if (!tier.logos || tier.logos.length === 0) return null

          return (
            <div key={index}>
              <h3 className="text-xl font-semibold mb-6 text-center text-muted-foreground uppercase tracking-wider">
                {tier.tierName}
              </h3>
              {tier.displayMode === 'carousel' ? (
                <LogoCarousel logos={tier.logos} />
              ) : (
                <LogoGrid logos={tier.logos} />
              )}
            </div>
          )
        })}
      </div>
    </BlockWrapper>
  )
}
