import React from 'react'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { BlockWrapper } from '@/components/BlockWrapper'

import type { TextColumnsBlock as TextColumnsBlockProps } from '@/payload-types'

/**
 * Grid class mappings for each layout preset.
 *
 * These are spelled out as complete Tailwind classes (not interpolated)
 * so the Tailwind compiler can find them during its static analysis pass.
 * Yes, this is verbose. No, there is no better way. Tailwind's JIT compiler
 * does string matching, not runtime evaluation. If you try to be clever
 * with template literals, you *will* ship missing styles to prod and spend
 * two hours wondering why.
 */
const layoutClasses: Record<string, string> = {
  oneColumn: 'grid-cols-1',
  twoEqual: 'grid-cols-1 md:grid-cols-2',
  twoWideLeft: 'grid-cols-1 md:grid-cols-3',
  twoWideRight: 'grid-cols-1 md:grid-cols-3',
  threeEqual: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  fourEqual: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

/**
 * For asymmetric layouts, specific columns get different span classes.
 * Index 0 = first column, index 1 = second column.
 */
const columnSpanClasses: Record<string, Record<number, string>> = {
  twoWideLeft: { 0: 'md:col-span-2', 1: 'md:col-span-1' },
  twoWideRight: { 0: 'md:col-span-1', 1: 'md:col-span-2' },
}

export const TextColumnsBlock: React.FC<TextColumnsBlockProps> = ({
  sectionHeading,
  layout,
  columns,
  background,
}) => {
  const gridClass = layoutClasses[layout ?? 'twoEqual'] ?? layoutClasses.twoEqual
  const spanOverrides = columnSpanClasses[layout ?? '']

  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-10">{sectionHeading}</h2>}
      <div className={cn('grid gap-8 lg:gap-12', gridClass)}>
        {columns?.map((col, index) => (
          <div key={index} className={cn(spanOverrides?.[index])}>
            {col.richText && <RichText data={col.richText} enableGutter={false} />}
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
