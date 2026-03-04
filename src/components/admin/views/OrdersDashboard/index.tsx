import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { OrdersDashboardClient } from './OrdersDashboardClient'

/**
 * Orders Dashboard — custom admin view at /admin/orders-dashboard.
 *
 * Server component reads SiteSettings (fiscalYearStartMonth + taxName)
 * then delegates all period-based data fetching to the client component
 * via /api/admin/orders-data.
 */
export default async function OrdersDashboardView(props: AdminViewServerProps) {
  const { initPageResult, i18n, payload: payloadInstance, permissions, user } = props
  const { visibleEntities, req } = initPageResult
  const payload = req.payload

  const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const fiscalYearStartMonth = Number(siteSettings.fiscalYearStartMonth ?? '1')
  const taxName = siteSettings.taxName ?? 'Tax'

  return (
    <DefaultTemplate
      visibleEntities={visibleEntities}
      i18n={i18n}
      payload={payloadInstance}
      permissions={permissions}
      user={user}
    >
      <Gutter>
        <OrdersDashboardClient
          fiscalYearStartMonth={fiscalYearStartMonth}
          taxName={taxName}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
