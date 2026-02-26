'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'

import type { TestimonialsBlock } from '@/payload-types'

type Testimonial = NonNullable<TestimonialsBlock['testimonials']>[number]

interface TestimonialsCarouselProps {
  testimonials: Testimonial[]
  autoAdvance?: boolean | null
}

/**
 * Client-side carousel for testimonials.
 *
 * Renders one testimonial at a time with prev/next navigation.
 * Layout: pullquote on the left, full quote + attribution on the right.
 * Stacks vertically on mobile. Optional auto-advance with pause on hover.
 */
export function TestimonialsCarousel({ testimonials, autoAdvance }: TestimonialsCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = testimonials.length

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count)
    },
    [count],
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance || paused || count <= 1) return

    const timer = setInterval(next, 8000)
    return () => clearInterval(timer)
  }, [autoAdvance, paused, count, next])

  if (!testimonials[0]) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/*
       * All slides are in the DOM at all times — only opacity changes.
       * This means every image loads exactly once on mount; no re-requests
       * as the carousel advances. Non-active slides are hidden from
       * assistive tech via aria-hidden and removed from tab order via
       * pointer-events-none.
       */}
      <div className="relative min-h-62.5">
        {testimonials.map((testimonial, i) => {
          const hasPhoto = testimonial.photo && typeof testimonial.photo === 'object'
          const isActive = i === current

          return (
            <div
              key={i}
              className={cn(
                'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start transition-opacity duration-500',
                isActive
                  ? 'opacity-100 relative'
                  : 'opacity-0 absolute inset-0 pointer-events-none',
              )}
              aria-hidden={!isActive}
            >
              {/* Pullquote side */}
              <div className="flex items-start">
                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold italic leading-snug text-theme-primary">
                  &ldquo;{testimonial.pullquote}&rdquo;
                </blockquote>
              </div>

              {/* Full quote + attribution side */}
              <div className="flex flex-col">
                {testimonial.fullQuote && (
                  <div className="mb-6 text-base leading-relaxed">
                    <RichText data={testimonial.fullQuote} enableGutter={false} />
                  </div>
                )}

                {/* Attribution */}
                <div className="flex items-center gap-4 mt-auto">
                  {hasPhoto && (
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
                      <Media
                        resource={testimonial.photo as NonNullable<typeof testimonial.photo>}
                        imgClassName="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{testimonial.attributionName}</div>
                    {testimonial.attributionOrg && (
                      <div className="text-sm text-muted-foreground">
                        {testimonial.attributionOrg}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Previous testimonial"
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-colors',
                  index === current ? 'bg-theme-primary' : 'bg-border hover:bg-muted-foreground',
                )}
                aria-label={`Go to testimonial ${index + 1}`}
                type="button"
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Next testimonial"
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
