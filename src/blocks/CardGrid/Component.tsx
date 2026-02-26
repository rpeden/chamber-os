import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { BlockWrapper } from '@/components/BlockWrapper'

import type { CardGridBlock as CardGridBlockProps } from '@/payload-types'

/**
 * Column count → Tailwind grid classes.
 * Spelled out for the JIT compiler. Responsive collapse: 4→2→1, 3→2→1, 2→1.
 */
const columnClasses: Record<string, string> = {
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export const CardGridBlock: React.FC<CardGridBlockProps> = ({
  sectionHeading,
  columns,
  cards,
  background,
}) => {
  const gridClass = columnClasses[columns ?? '3'] ?? columnClasses['3']

  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-10">{sectionHeading}</h2>}
      <div className={cn('grid gap-8', gridClass)}>
        {cards?.map((card, index) => (
          <div
            key={index}
            className="flex flex-col bg-card border border-border rounded-lg overflow-hidden"
          >
            {card.image && typeof card.image === 'object' && (
              <div className="aspect-video overflow-hidden">
                <Media resource={card.image} imgClassName="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col flex-1 p-6">
              <h3 className="text-xl font-semibold mb-3">{card.heading}</h3>
              {card.body && (
                <div className="flex-1 mb-4">
                  <RichText data={card.body} enableGutter={false} />
                </div>
              )}
              {card.enableLink && card.link && (
                <div className="mt-auto">
                  <CMSLink {...card.link} appearance="default" size="sm" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
