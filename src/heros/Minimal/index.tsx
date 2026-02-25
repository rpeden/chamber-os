import React from 'react'

import type { Page } from '@/payload-types'

/**
 * Minimal hero for interior pages.
 *
 * Just a heading and optional subheading on a clean background.
 * For the "About Us" and "Contact" pages of the world — the ones
 * that need a title but don't need to make a Statement.
 */
export const MinimalHero: React.FC<Page['hero']> = ({ heading, subheading }) => {
  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-3xl">
        {heading && (
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{heading}</h1>
        )}
        {subheading && (
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">{subheading}</p>
        )}
      </div>
    </div>
  )
}
