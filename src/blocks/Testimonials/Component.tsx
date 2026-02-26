import React from 'react'
import { BlockWrapper } from '@/components/BlockWrapper'
import { TestimonialsCarousel } from './Carousel'

import type { TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'

/**
 * Testimonials block — server component wrapper that renders the heading
 * and delegates carousel interaction to the client component.
 */
export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({
  sectionHeading,
  testimonials,
  autoAdvance,
  background,
}) => {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <BlockWrapper background={background}>
      {sectionHeading && (
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">{sectionHeading}</h2>
      )}
      <TestimonialsCarousel testimonials={testimonials} autoAdvance={autoAdvance} />
    </BlockWrapper>
  )
}
