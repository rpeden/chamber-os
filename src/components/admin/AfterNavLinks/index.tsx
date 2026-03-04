'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavGroup } from '@payloadcms/ui'

const navLinks = [
  { label: 'Events Manager', href: '/admin/events-manager' },
  { label: 'CRM Dashboard', href: '/admin/crm' },
  { label: 'Orders Dashboard', href: '/admin/orders-dashboard' },
]

/**
 * Custom sidebar nav section rendered after Payload's built-in nav links.
 * Uses Payload's NavGroup for native admin panel styling.
 */
export default function AfterNavLinks() {
  const pathname = usePathname()

  return (
    <NavGroup label="Tools">
      {navLinks.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            className={['nav__link', isActive ? 'nav__link--active' : '']
              .filter(Boolean)
              .join(' ')}
            href={href}
            key={href}
            prefetch={false}
          >
            {isActive && <div className="nav__link-indicator" />}
            <span className="nav__link-label">{label}</span>
          </Link>
        )
      })}
    </NavGroup>
  )
}
