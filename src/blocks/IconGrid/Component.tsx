import React from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { BlockWrapper } from '@/components/BlockWrapper'

import type { IconGridBlock as IconGridBlockProps } from '@/payload-types'

const columnClasses: Record<string, string> = {
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export const IconGridBlock: React.FC<IconGridBlockProps> = ({
  sectionHeading,
  columns,
  items,
  background,
}) => {
  const gridClass = columnClasses[columns ?? '3'] ?? columnClasses['3']

  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-10">{sectionHeading}</h2>}
      <div className={cn('grid gap-8 lg:gap-10', gridClass)}>
        {items?.map((item, index) => (
          <div key={index} className="flex flex-col items-start">
            {item.icon && typeof item.icon === 'object' && (
              <div className="mb-4 w-12 h-12 flex items-center justify-center">
                <Media resource={item.icon} imgClassName="w-12 h-12 object-contain" />
              </div>
            )}
            {item.overline && (
              <span className="text-sm font-semibold uppercase tracking-wider text-theme-primary mb-1">
                {item.overline}
              </span>
            )}
            <h3 className="text-lg font-semibold mb-2">{item.heading}</h3>
            {item.body && <p className="text-muted-foreground leading-relaxed mb-3">{item.body}</p>}
            {item.enableLink && item.link && (
              <CMSLink {...item.link} appearance="inline" className="mt-auto" />
            )}
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
