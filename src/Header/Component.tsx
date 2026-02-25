import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import React from 'react'

import type { Header } from '@/payload-types'

/**
 * Server Component wrapper for the Header.
 * Fetches header nav data and site settings (for logo/social links),
 * then passes everything to the client component for interactivity.
 */
export async function Header() {
  const [headerData, siteSettings] = await Promise.all([
    getCachedGlobal('header', 1)() as Promise<Header>,
    getSiteSettings(),
  ])

  // Extract the logo URL if one is set
  const logo =
    siteSettings?.logo && typeof siteSettings.logo === 'object' ? siteSettings.logo : null

  const siteName = (siteSettings?.siteName as string) || 'Chamber of Commerce'

  // Social links for utility nav
  const socialLinks =
    siteSettings?.socialLinks && Array.isArray(siteSettings.socialLinks)
      ? siteSettings.socialLinks
      : []

  return (
    <HeaderClient data={headerData} logo={logo} siteName={siteName} socialLinks={socialLinks} />
  )
}
