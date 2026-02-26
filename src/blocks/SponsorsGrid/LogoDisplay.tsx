'use client'

import React, { useState, useCallback } from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'

import type { SponsorsGridBlock } from '@/payload-types'

type Logo = NonNullable<NonNullable<SponsorsGridBlock['tiers']>[number]['logos']>[number]

interface LogoCarouselProps {
  logos: Logo[]
}

/**
 * Client-side carousel for a single sponsor tier's logos.
 * Shows a window of logos with prev/next navigation.
 */
export function LogoCarousel({ logos }: LogoCarouselProps) {
  const [offset, setOffset] = useState(0)

  // Show up to 4 logos at a time on desktop
  const visibleCount = 4
  const maxOffset = Math.max(0, logos.length - visibleCount)

  const next = useCallback(() => setOffset((prev) => Math.min(prev + 1, maxOffset)), [maxOffset])
  const prev = useCallback(() => setOffset((prev) => Math.max(prev - 1, 0)), [])

  return (
    <div className="relative flex items-center gap-4">
      {/* Prev button */}
      <button
        onClick={prev}
        disabled={offset === 0}
        className={cn(
          'shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors',
          offset === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted',
        )}
        aria-label="Previous sponsors"
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

      {/* Logos window */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex gap-8 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${offset * (100 / visibleCount)}%)` }}
        >
          {logos.map((item, index) => (
            <LogoItem key={index} item={item} />
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={next}
        disabled={offset >= maxOffset}
        className={cn(
          'shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center transition-colors',
          offset >= maxOffset ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted',
        )}
        aria-label="Next sponsors"
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
  )
}

/**
 * Individual logo item — shared between grid and carousel rendering.
 */
function LogoItem({ item }: { item: Logo }) {
  const hasLogo = item.logo && typeof item.logo === 'object'
  if (!hasLogo) return null

  const inner = (
    <div className="relative h-40 w-64 shrink-0" title={item.sponsorName ?? undefined}>
      <Media
        resource={item.logo as NonNullable<typeof item.logo>}
        fill
        size="(max-width: 768px) 45vw, 16rem"
        imgClassName="object-contain object-center"
        disablePlaceholder
      />
    </div>
  )

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 grayscale hover:grayscale-0 transition-all duration-200 opacity-70 hover:opacity-100"
      >
        {inner}
      </a>
    )
  }

  return <div className="shrink-0 opacity-70">{inner}</div>
}

/**
 * Static grid display for a sponsor tier's logos — when you want them all
 * visible at once without carousel navigation.
 *
 * Uses CSS grid instead of flex-wrap so gaps don't cause fractional-width
 * items to overflow and overlap. That was a fun one to debug.
 */
export function LogoGrid({ logos }: { logos: Logo[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 items-center justify-items-center">
      {logos.map((item, index) => {
        const hasLogo = item.logo && typeof item.logo === 'object'
        if (!hasLogo) return null

        const inner = (
          <div className="relative h-40 w-64" title={item.sponsorName ?? undefined}>
            <Media
              resource={item.logo as NonNullable<typeof item.logo>}
              fill
              size="(max-width: 768px) 45vw, 16rem"
              imgClassName="object-contain object-center"
              disablePlaceholder
            />
          </div>
        )

        if (item.url) {
          return (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grayscale hover:grayscale-0 transition-all duration-200 opacity-70 hover:opacity-100"
            >
              {inner}
            </a>
          )
        }

        return (
          <div key={index} className="opacity-70">
            {inner}
          </div>
        )
      })}
    </div>
  )
}
