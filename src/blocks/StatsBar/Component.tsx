import React from 'react'
import { BlockWrapper } from '@/components/BlockWrapper'

import type { StatsBarBlock as StatsBarBlockProps } from '@/payload-types'

/**
 * Stats Bar — a horizontal row of big numbers + labels.
 *
 * Because the brand background IS the theme primary color,
 * using `text-theme-primary` for the numbers on a brand/dark
 * background makes them invisible (navy on navy). So we flip
 * the number color to white on dark/brand backgrounds.
 *
 * Similarly, the label uses `text-muted-foreground` which is
 * a medium grey — fine on light backgrounds, terrible on dark ones.
 * On dark/brand, labels become white at 70% opacity.
 */
export const StatsBarBlock: React.FC<StatsBarBlockProps> = ({
  sectionHeading,
  stats,
  background,
}) => {
  const isDark = background === 'dark' || background === 'brand'

  return (
    <BlockWrapper background={background}>
      {sectionHeading && (
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">{sectionHeading}</h2>
      )}
      <div className="flex flex-wrap justify-center gap-8 md:gap-16 lg:gap-20">
        {stats?.map((stat, index) => (
          <div key={index} className="text-center px-4">
            <div
              className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-theme-primary'
              }`}
            >
              {stat.number}
            </div>
            <div
              className={`text-sm md:text-base font-medium uppercase tracking-wider ${
                isDark ? 'text-white/70' : 'text-muted-foreground'
              }`}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
