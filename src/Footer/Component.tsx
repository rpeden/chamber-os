import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import Link from 'next/link'
import React from 'react'

import type { Footer as FooterType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'

/** Map social platform slugs to Lucide icons */
const socialIcons: Record<string, React.FC<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
}

/**
 * Multi-column footer with contact info + social pulled from Site Settings.
 *
 * Columns are admin-configurable. Contact + social show automatically if
 * populated in Site Settings. Copyright text auto-replaces {year}.
 */
export async function Footer() {
  const [footerData, siteSettings] = await Promise.all([
    getCachedGlobal('footer', 1)() as Promise<FooterType>,
    getSiteSettings(),
  ])

  const columns = footerData?.columns || []
  const copyright = footerData?.copyright || ''
  const copyrightText = copyright.replace('{year}', String(new Date().getFullYear()))

  const { siteName, email, phone, address, socialLinks } = siteSettings || {}

  return (
    <footer className="mt-auto bg-theme-primary text-white">
      <div className="container py-12">
        {/* ── Upper section: columns + contact ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Site name + contact info column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold font-theme-heading">{siteName || 'Home'}</span>
            </Link>
            <div className="space-y-2 text-sm text-white/80">
              {address && (
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex gap-2 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{email}</span>
                </a>
              )}
            </div>

            {/* Social icons */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-3 pt-2">
                {socialLinks.map((social, i) => {
                  const Icon = socialIcons[social.platform]
                  return Icon ? (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label={social.platform}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* CMS-configured columns */}
          {columns.map((col, i) => (
            <div key={i} className="space-y-3">
              <h3 className="font-bold font-theme-heading text-sm uppercase tracking-wider">
                {col.heading}
              </h3>
              {col.links && col.links.length > 0 && (
                <nav className="flex flex-col gap-2">
                  {col.links.map(({ link }, j) => (
                    <CMSLink
                      key={j}
                      {...link}
                      appearance="inline"
                      className="text-sm text-white/80 hover:text-white transition-colors"
                    />
                  ))}
                </nav>
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/60">{copyrightText}</p>
          {/* Theme selector hidden — revisit when multi-theme support lands */}
        </div>
      </div>
    </footer>
  )
}
