import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import { BlockWrapper } from '@/components/BlockWrapper'

import type { MixedContentRowBlock as MixedContentRowBlockProps } from '@/payload-types'

/**
 * Width fraction → CSS grid column span.
 * Uses a 12-column grid because 12 divides evenly by 2, 3, 4, and 6.
 * Tailwind classes are spelled out for JIT.
 */
const widthClasses: Record<string, string> = {
  quarter: 'md:col-span-3',
  third: 'md:col-span-4',
  half: 'md:col-span-6',
  twoThirds: 'md:col-span-8',
  threeQuarters: 'md:col-span-9',
  full: 'md:col-span-12',
}

const alignmentClasses: Record<string, string> = {
  top: 'items-start',
  center: 'items-center',
  bottom: 'items-end',
}

export const MixedContentRowBlock: React.FC<MixedContentRowBlockProps> = ({
  sectionHeading,
  verticalAlignment,
  slots,
  background,
}) => {
  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-10">{sectionHeading}</h2>}
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-12 gap-8',
          alignmentClasses[verticalAlignment ?? 'top'],
        )}
      >
        {slots?.map((slot, index) => (
          <div key={index} className={cn('col-span-1', widthClasses[slot.width ?? 'half'])}>
            <SlotContent slot={slot} />
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}

/**
 * Renders the content of a single slot based on its content type.
 */
function SlotContent({ slot }: { slot: NonNullable<MixedContentRowBlockProps['slots']>[number] }) {
  switch (slot.contentType) {
    case 'richText':
      return slot.richText ? <RichText data={slot.richText} enableGutter={false} /> : null

    case 'image':
      return slot.image && typeof slot.image === 'object' ? (
        <Media resource={slot.image} imgClassName="w-full h-auto rounded-lg" />
      ) : null

    case 'cta':
      return (
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
          {slot.ctaHeading && <h3 className="text-2xl font-bold mb-3">{slot.ctaHeading}</h3>}
          {slot.ctaBody && <p className="text-muted-foreground mb-6">{slot.ctaBody}</p>}
          {slot.link && <CMSLink {...slot.link} size="lg" />}
        </div>
      )

    default:
      return null
  }
}
