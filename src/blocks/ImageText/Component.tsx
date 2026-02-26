import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { BlockWrapper } from '@/components/BlockWrapper'

import type { ImageTextBlock as ImageTextBlockProps } from '@/payload-types'

export const ImageTextBlock: React.FC<ImageTextBlockProps> = ({
  layout,
  image,
  heading,
  body,
  enableCta,
  link,
  background,
}) => {
  const isImageRight = layout === 'imageRight'

  return (
    <BlockWrapper background={background}>
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center',
          isImageRight && 'md:[&>*:first-child]:order-2',
        )}
      >
        {/* Image column */}
        <div className="overflow-hidden rounded-lg">
          {image && typeof image === 'object' && (
            <Media resource={image} imgClassName="w-full h-auto rounded-lg" />
          )}
        </div>

        {/* Text column */}
        <div className="flex flex-col">
          {heading && <h2 className="text-3xl md:text-4xl font-bold mb-4">{heading}</h2>}
          {body && (
            <div className="mb-6">
              <RichText data={body} enableGutter={false} />
            </div>
          )}
          {enableCta && link && (
            <div>
              <CMSLink {...link} size="lg" />
            </div>
          )}
        </div>
      </div>
    </BlockWrapper>
  )
}
