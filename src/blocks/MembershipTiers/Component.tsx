import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cn } from '@/utilities/ui'
import { BlockWrapper } from '@/components/BlockWrapper'
import { CMSLink } from '@/components/Link'
import { formatCurrency, getCurrency } from '@/lib/currency'
import { CheckIcon } from 'lucide-react'

import type { MembershipTiersBlock as MembershipTiersBlockProps } from '@/payload-types'

/**
 * Membership Tiers block — server component that fetches tiers from the
 * collection and renders pricing cards. Highlighted tier gets visual emphasis.
 */
export const MembershipTiersBlock: React.FC<MembershipTiersBlockProps> = async ({
  sectionHeading,
  introText,
  highlightedTier,
  ctaLabel,
  ctaLink,
  background,
}) => {
  const payload = await getPayload({ config })

  // Fetch tiers ordered by displayOrder, and site currency setting
  const [tiersResult, siteSettings] = await Promise.all([
    payload.find({
      collection: 'membership-tiers',
      sort: 'displayOrder',
      limit: 20,
      depth: 0,
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])

  const tiers = tiersResult.docs
  if (!tiers || tiers.length === 0) return null

  const currencyCode = siteSettings?.currency
  const currency = getCurrency(currencyCode)
  const highlightedId =
    typeof highlightedTier === 'object' && highlightedTier !== null
      ? highlightedTier.id
      : highlightedTier

  return (
    <BlockWrapper background={background}>
      {sectionHeading && (
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">{sectionHeading}</h2>
      )}
      {introText && (
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-10">
          {introText}
        </p>
      )}
      {!introText && sectionHeading && <div className="mb-10" />}

      <div
        className={cn(
          'grid gap-8 mx-auto',
          tiers.length === 1 && 'max-w-md grid-cols-1',
          tiers.length === 2 && 'max-w-3xl grid-cols-1 md:grid-cols-2',
          tiers.length === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          tiers.length >= 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {tiers.map((tier) => {
          const isHighlighted = highlightedId != null && String(tier.id) === String(highlightedId)

          return (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-lg border p-6 md:p-8',
                isHighlighted
                  ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary'
                  : 'border-border bg-card',
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>

              <div className="mb-6">
                <span className="text-4xl font-extrabold tracking-tight">
                  {formatCurrency(tier.annualPrice, currency.code)}
                </span>
                <span className="text-muted-foreground ml-1">/year</span>
              </div>

              {tier.features && tier.features.length > 0 && (
                <ul className="flex-1 space-y-3 mb-8">
                  {tier.features.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{item.feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {ctaLink && (
                <div className="mt-auto">
                  <CMSLink
                    {...ctaLink}
                    label={ctaLabel || 'Get Started'}
                    appearance={isHighlighted ? 'default' : 'outline'}
                    className="w-full justify-center"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </BlockWrapper>
  )
}
